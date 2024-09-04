import md5 from 'md5';
import jwt from 'jsonwebtoken';

import Users from '../models/Users.js';
import {hash} from "bcrypt";
import {Sequelize} from "sequelize";
import Reviews from "../models/Reviews.js";

export default {
    async registration(req, res) {
        try{
            const {username, password} = req.body;
            //const hashedPassword = md5(md5(password) + process.env.SECRET_FOR_PASSWORD);
            const [user, created] = await Users.findOrCreate({
                where: { username: username },
                defaults: {
                     username,
                     password
                }
            });
            if (!created) {
                return res.status(409).json({
                    message: 'User already exists',
                });
            } else {
                return res.status(201).json({
                    message: 'User created successfully',
                    user: user,
                });
            }
        }catch (error) {
            console.error('Registration Error:', error);
            return res.status(500).json({
                message: 'registration failed',
                error: error.message,
            });
        }
    },
    async login(req, res) {
        try {
            const { username, password } = req.body;

            const user = await Users.findOne({
                where: {username},

            });
            //const hashedPassword = md5(md5(password) + process.env.SECRET_FOR_PASSWORD);
            const hashedPassword = Users.hash(password)


            if (!user || hashedPassword !== user.getDataValue("password")) {
                return res.status(400).json({
                    message: 'Invalid username or password'
                });
            }

            const payload = {
                username: user.username,
                id: user.id
            };

            const token = jwt.sign(
                payload,
                process.env.SECRET_FOR_JWT, {
                expiresIn: '24h'
            });


            console.log(token)
            // console.log(user)


            if (user.type === "admin"){
                return res.status(200).json({
                    message: 'Admin logged in successfully',
                    user: user,
                    token: token,
                    isAdmin:true
                });
            }

            return res.status(200).json({
                message: 'User logged in successfully',
                user: user,
                token: token,
                isAdmin:false
            });


        } catch (error) {
            console.error('Login Error:', error);
            return res.status(500).json({
                message: 'Login failed',
                error: error.message
            });
        }
    },
     getActiveReviewers:async(req, res) =>{
        try {
            const total = await Users.count();

            let page = +req.query.page
            let limit = +req.query.limit
            const order = req.query.order;

            const offset = (page - 1) * limit;

            const maxPageCount = Math.ceil(total / limit);

            if (page > maxPageCount) {
                return res.status(404).json({
                    message: 'Page not found.',
                    users: []
                });
            }

            const { id: userId } = req.user;
            const userExists = await Users.findByPk(userId);

            if (!userExists) {
                return res.status(404).json({
                    message: 'User not found.'
                });
            }

            const topActiveReviewers = await Users.findAll({
                attributes: [
                    'id',
                    'username',
                    [
                        Sequelize.fn('COUNT', Sequelize.col('reviews.id')),
                        'reviewCount'
                    ]
                ],
                include: [
                    {
                        model: Reviews,
                        attributes: []
                    }
                ],
                group: ['Users.id'],
                order: [
                    [Sequelize.fn('COUNT', Sequelize.col('reviews.id')), order]
                ],
                // limit,
                // offset
            });

            return res.status(200).json({
                message: 'Most active reviewers retrieved successfully.',
                topActiveReviewers,
                total,
                currentPage: page,
                totalPages: maxPageCount
            });

        } catch (e) {
            console.error('Error fetching active reviewers:', e);
            return res.status(500).json({
                message: 'Internal server error',
                error: e.message
            });
        }
    }
}
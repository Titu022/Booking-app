const { BadRequestError } = require("../utils/error");
const prisma = require('../config/prisma');
const authService = require('../services/auth.service');

exports.sendOtp = async(req, res) => {
    const {userName, email, password} = req.body;
    if(!userName || !email || !password){
        throw new BadRequestError(`userName, email and password is required`);
    }

    const result = await authService.sendOtp(userName, email, password);

}
const bcrypt = require('bcrypt');
const {generateAndStoreOtp, verifyOtp} = require('../utils/generateAndStoreOtp');
const {prisma} = require('../config/prisma');
const { ConflictError, BadRequestError } = require('../utils/error');

const sendOtp = async(userName, email, password) => {
    const existing = await prisma.user.findUnique({
        where:{email}
    });
    if(existing){
        throw new ConflictError(`user already exists with this email`);
    }
    const hashedPassowrd = bcrypt.hash(password, 12);
    const {otp, otpSessionId} = await generateAndStoreOtp({userName, email, hashedPassowrd});

    // await notificationProducer.sendOtpEmail(email, otp, process.env.OTP_TTL / 60);

    return {otpSessionId};

}

const verifyOtp = async(otp, otpSessionId) => {
    if(!otp || !otpSessionId){
        throw new BadRequestError(`otp and otpSessionId is required`);
    }

    const meta = verifyOtp(otp, otpSessionId);

    if(meta == null){
        throw new BadRequestError(`otp doesn't match or otp has expired`);
    }

    const user = await prisma.user.create({
        data:{
            userName: meta.userName,
            email: meta.email,
            password: meta.hashedPassowrd,
            emailVerified: true
        }
    });
    
    return user;

}
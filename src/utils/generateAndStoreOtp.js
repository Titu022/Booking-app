const OtpGenerator = require('otp-generator');
const prisma = require('../config/prisma');
const {redis} = require('../config/redis');
const crypto = require('crypto');
const { TooManyRequestsError } = require('./error');

function hmacFor(email, otp){
    return crypto.createHmac('sha256', process.env.HMAC_SECRET).update(email + ":" + otp).digest("hex");
}

const generateAndStoreOtp = async (meta) => {

    const ratekey = `otp:generate:${meta.email}`;
    const sentCount = parseInt(await redis.get(ratekey) || '0', 10);

    if(sentCount > 10){
        throw new TooManyRequestsError(`Too many otp generation requests`);
    }

    const otp = OtpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });

    const otpSessionId = crypto.randomUUID();

    const hashedOtp = hmacFor(meta.email, otp);

    await redis.set(`otp:session:${otpSessionId}`, JSON.stringify({
        hashedOtp: hashed,
        meta
    }), 'EX', process.env.OTP_TTL);

    await redis.incr(ratekey);
    await redis.expire(ratekey, 3600);

    return {otp, otpSessionId};
}

const verifyOtp = async(otp, otpSessionId) => {
    const key = `otp:session:${otpSessionId}`;
    const rawData = await redis.get(key);
    if(!rawData){
        return null;
    }

    const ratekey = `otp:verify:${meta.email}`;
    const attempts = parseInt(await redis.get(ratekey) || '0', 10);
    if(attempts > 10){
        throw TooManyRequestsError(`max attempt has been reached`);
    }

    const {hashedOtp: storedOtp, meta} = JSON.parse(rawData);

    const hashedOtp = hmacFor(otp);
    if(crypto.timingSafeEqual(Buffer.from(hashedOtp, 'hex'), Buffer.from(storedOtp, 'hex'))){
        const hehe = `otp:generate:${meta.email}`;
        await redis.del(hehe);
        await redis.del(ratekey);
        return meta;
    }
    else{
        await redis.incr(ratekey);
        redis.expire(ratekey, process.env.OTP_TTL);
        return null;
    }
}

module.exports = {generateAndStoreOtp, verifyOtp};
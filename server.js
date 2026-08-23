require('dotenv').config();
const app = require('./src/app');

const startServer = async () => {
    try{
        app.listen(process.env.PORT, () => {
            console.log(`app is running on PORT ${process.env.PORT}`);
        })
    }
    catch(err){
        console.log(err);
    }
}

startServer();
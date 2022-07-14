import * as dotenv from 'dotenv'
import {initS3Client} from './lib/index.mjs';

dotenv.config();

const start = async () => {
    const client = await initS3Client()
    console.log(client.config.region());
}

start();

console.log('Loading function');

const aws = require('aws-sdk');
// const request = require('request');


const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
    console.log(event);
    // Get the object from the event and show its content type
    const params = {
        Bucket: 'blurring-images',
        Prefix: 'blurred-1Lq68k2'
    };
    try {
        const { Contents } = await s3.listObjectsV2(params).promise();
        console.log('CONTENTS: ', Contents.length);
        if (Contents.length === 4) {
            // const res = await request.post('https://dcd3ece4.ngrok.io/complete/1Lq68k2', {form:{}})
        }
        return Contents;
    } catch (err) {
        console.log(err);
        const message = `Error getting objects from bucket. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

console.log('Loading function');

const aws = require('aws-sdk');
const axios = require('axios');


const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
	const blurringId = event.Records[0].s3.object.key.substring(
		event.Records[0].s3.object.key.lastIndexOf("d-") + 2,
		event.Records[0].s3.object.key.lastIndexOf("/")
	);
	// Get the object from the event and show its content type
	const params = {
		Bucket: 'blur-images',
		Prefix: 'blurred-' + blurringId
	};
	try {
		const { Contents } = await s3.listObjectsV2(params).promise();
		if (Contents.length === 4) {
			const res = await axios.post('http://ec2-54-197-11-151.compute-1.amazonaws.com:7878/complete/' + blurringId, {event})
			/*
			// Ngrok tunneling used for development on local machine :)
			// const res = await axios.post('https://dcd3ece4.ngrok.io/complete/' + blurringId, {event})
			 	console.log(res.data);
			*/
		}
		return Contents;
	} catch (err) {
		console.log(err);
		const message = `Error getting objects from bucket. Make sure they exist and your bucket is in the same region as this function.`;
		console.log(message);
		throw new Error(message);
	}
};

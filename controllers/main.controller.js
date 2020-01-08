const { ReE, ReS, to, TE }         = require('../services/UtilService');
const axios                        = require('axios');
const formidable                   = require('formidable');
const sharp                        = require('sharp');
const AWS                          = require("aws-sdk");
const randomstring                 = require("randomstring");
const {dbClient, publisher}        = require('../redis');

AWS.config = new AWS.Config();
// We know this is bad, but to avoid sending .env file separate to the teacher we used secret keys diretly in the code
AWS.config.accessKeyId = process.env.S3_ACCESS_KEY;
AWS.config.secretAccessKey = process.env.S3_SECRET_KEY;
AWS.config.region = 'us-east-1';
const s3Bucket = new AWS.S3({ params: { Bucket: 'blur-images' }});

/**
 * Upload endpoint
 */
const upload = async function(req, res){
	let form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		try {
			const file = sharp(files.file.path);
			file.metadata().then(async function ({ width, height, format}) {
				const xLimit = Math.floor(width / 2);
				const yLimit = Math.floor(height / 2);
				const blurringId = randomstring.generate(7);
				let urls = {};

				// Original
				let [err, buffer] = await to(file.toBuffer());
				if (err) TE(err);

				let position = 'original';
				urls[position] = `${process.env.S3_URL}/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) {
					console.error(err);
					TE(err);
				}

				// Top left
				[err, buffer] = await to(file.extract({
					left: 0,
					top: 0,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'top-left';
				urls[position] = `${process.env.S3_URL}/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				//[err] = await to(axios.get(`${process.env.WORKER_URL}/blur/${blurringId}/${position}.${format}`));
				//if (err) TE(res, err);
				publisher.publish("java_node_channel_1", blurringId + '---' + position + '.' + format);


				// Top right
				[err, buffer] = await to(file.extract({
					left: xLimit - 1,
					top: 0,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'top-right';
				urls[position] = `${process.env.S3_URL}/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				//[err] = await to(axios.get(`${process.env.WORKER_URL}/blur/${blurringId}/${position}.${format}`));
				//if (err) TE(res, err);
				publisher.publish("java_node_channel_1", blurringId + '---' + position + '.' + format);


				// Bottom left
				[err, buffer] = await to(file.extract({
					left: 0,
					top: yLimit - 1,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'bottom-left';
				urls[position] = `${process.env.S3_URL}/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				//[err] = await to(axios.get(`${process.env.WORKER_URL}/blur/${blurringId}/${position}.${format}`));
				//if (err) TE(res, err);
				publisher.publish("java_node_channel_1", blurringId + '---' + position + '.' + format);

				// Bottom right
				[err, buffer] = await to(file.extract({
					left: xLimit - 1,
					top: yLimit - 1,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'bottom-right';
				urls[position] = `${process.env.S3_URL}/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				//[err] = await to(axios.get(`${process.env.WORKER_URL}/blur/${blurringId}/${position}.${format}`));
				//if (err) TE(res, err);
				publisher.publish("java_node_channel_1", blurringId + '---' + position + '.' + format);

				// Save to Redis
				await dbClient.set(blurringId, JSON.stringify({
					"original": {...urls, xLimit, yLimit, format },
					"blurred": {},
				}));

				return ReS(res, {message: 'Success', blurringId, format});
			})
		} catch (err) {
			return ReE(res, err);
		}
	});
};
module.exports.upload = upload;

/**
 * List files in s3 bucket - Testing for Lambda function
 */
const list = async function (req, res) {
	let params = {
		Bucket: 'blur-images', /* required */
		Prefix: 'blurred-1eFJ1kf'  // Can be your folder name
	};
	s3Bucket.listObjectsV2(params, function(err, data) {
		if (err) return ReE(res, err);
		return ReS(res, {message: 'Success', data, filesCount: data.Contents.length});
	});
};
module.exports.list = list;


/**
 * Endpoint triggered by Lambda when blurring is done
 */
const complete = async function (req, res) {
	const blurringId = req.params.id;
	dbClient.get(blurringId, async function (err, data) {

		const xLimit = JSON.parse(data).original.xLimit;
		const yLimit = JSON.parse(data).original.yLimit;
		const format = JSON.parse(data).original.format;

		let images = [{
			src: process.env.S3_URL + '/images-' + blurringId + '/original.' + format, x: 0, y: 0
		},
			{
				src: JSON.parse(data).original['top-left'].replace(/images-/, 'blurred-'), x: 0, y: 0
			},
			{
				src: JSON.parse(data).original['top-right'].replace(/images-/, 'blurred-'), x: parseInt(xLimit), y: 0
			},
			{
				src: JSON.parse(data).original['bottom-left'].replace(/images-/, 'blurred-'), x: 0, y: parseInt(yLimit)
			},
			{
				src: JSON.parse(data).original['bottom-right'].replace(/images-/, 'blurred-'), x: parseInt(xLimit), y: parseInt(yLimit)
			}];

		const mergeImages = require('merge-images');
		const {Canvas,Image} = require('canvas');
		Canvas.Image = Image;
		mergeImages(images, { Canvas: Canvas }).then(async base64 => {
			let buff = Buffer.from( base64.replace(/^data:image\/png;base64,/, ""), 'base64');
			await s3Bucket.putObject({
				Key: `blurred-${blurringId}/complete.${format}`,
				Body: Buffer.from(buff, 'base64'),
				ContentEncoding: 'base64',
				ContentType: 'image/png',
				ACL: 'public-read'
			}, async (err) => {
				if (err) TE(err);

				await dbClient.set(blurringId, JSON.stringify({
					...data,
					"blurred": true,
				}));
				return ReS(res, {message: 'Complete'});
			});
		});
	});
};
module.exports.complete = complete;

/**
 * Polling endpoint to check if blurring process is done
 * - If completed flag true, blurred image will be displayed on the frontend
 */
const isCompleted = async function (req, res) {
	dbClient.get(req.params.blurringId, async function (err, result) {
		const data = JSON.parse(result);
		if (err) return ReE(res, err);
		if (data && data.blurred === true) return ReS(res, {completed: true});
		else return ReS(res, {completed: false});
	});
};
module.exports.isCompleted = isCompleted;

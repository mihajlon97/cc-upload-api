const { ReE, ReS, to, TE }         = require('../services/UtilService');
const axios                        = require('axios');
const formidable                   = require('formidable');
const sharp                        = require('sharp');
const AWS                          = require("aws-sdk");
const randomstring                 = require("randomstring");
const redis                        = require('../redis');

AWS.config = new AWS.Config();
// We know this is bad, but to avoid sending .env file separate to the teacher we used secret keys diretly in the code
AWS.config.accessKeyId = 'AKIAWQ7LVV7TNKIRAEVU';
AWS.config.secretAccessKey =  '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';
AWS.config.region = 'eu-central-1';
const s3Bucket = new AWS.S3({ params: { Bucket: 'blurring-images' }});

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

				// Top left
				let [err, buffer] = await to(file.extract({
					left: xLimit,
					top: 0,
					width: xLimit,
					height: yLimit
				}).toBuffer());
				if (err) TE(err);
				let position = 'top-left';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				await s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}, function (err) {
					if (err) TE(err);
				});

				// Top right
				[err, buffer] = await to(file.extract({
					left: xLimit,
					top: 0,
					width: xLimit,
					height: yLimit
				}).toBuffer());
				if (err) TE(err);

				position = 'top-right';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				await s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}, function (err) {
					if (err) TE(err);
				});

				// Bottom left
				[err, buffer] = await to(file.extract({
					left: 0,
					top: yLimit,
					width: xLimit,
					height: yLimit
				}).toBuffer());
				if (err) TE(err);

				position = 'bottom-left';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				await s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}, function (err) {
					if (err) TE(err);
				});

				// Bottom right
				[err, buffer] = await to(file.extract({
					left: xLimit,
					top: yLimit,
					width: xLimit,
					height: yLimit
				}).toBuffer());
				if (err) TE(err);

				position = 'bottom-right';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				await s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}, function (err) {
					if (err) TE(err);
				});

				// Save to Redis
				await redis.set(blurringId, JSON.stringify({
					"original": urls,
					"blurred": {},
				}));

				return ReS(res, {message: 'Success', width, height, format});
			})
		} catch (err) {
			return ReE(res, err);
		}
	});
	return;

	const body = req.body;
	console.log(req.file, req.files);
	if (!body.files)
		return ReE(res, { message: 'INVALID_DATA' });

	return ReS(res, {message: 'Success'});


	// Ping Service Registry (cPanel) to get location of service with that id
	let [err, response] = await to(axios.get('http://cpanel:1234/sections/' + body.section));
	if (err) return ReE(res, err);

	// Forward persons to right section and use location(address) from service registry
	let sectionAddress = response.data.section.address;
	[err, response] = await to(axios.post(sectionAddress + '/persons', {
		persons: body.persons
	}));
	if (err) return ReE(res, err);
	return ReS(res, {message: 'Success'});
};
module.exports.upload = upload;

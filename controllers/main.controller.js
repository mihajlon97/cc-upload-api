const { ReE, ReS, to, TE, asyncForEach }         = require('../services/UtilService');
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

				// Original
				let [err, buffer] = await to(file.toBuffer());
				if (err) TE(err);

				let position = 'original';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);


				// Top left
				[err, buffer] = await to(file.extract({
					left: 0,
					top: 0,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'top-left';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				[err] = await to(axios.get(`http://ec2-18-184-231-193.eu-central-1.compute.amazonaws.com/blur/${blurringId}/${position}.${format}`));
				if (err) {
					console.log('TOP LEFT ERROR ' + `http://ec2-18-184-231-193.eu-central-1.compute.amazonaws.com/blur/${blurringId}/${position}.${format}`, err);
					TE(res, err);
				}


				// Top right
				[err, buffer] = await to(file.extract({
					left: xLimit - 1,
					top: 0,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'top-right';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				[err] = await to(axios.get(`http://ec2-18-184-231-193.eu-central-1.compute.amazonaws.com/blur/${blurringId}/${position}.${format}`));
				if (err) TE(res, err);


				// Bottom left
				[err, buffer] = await to(file.extract({
					left: 0,
					top: yLimit - 1,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'bottom-left';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				[err] = await to(axios.get(`http://ec2-18-184-231-193.eu-central-1.compute.amazonaws.com/blur/${blurringId}/${position}.${format}`));
				if (err) TE(res, err);

				// Bottom right
				[err, buffer] = await to(file.extract({
					left: xLimit - 1,
					top: yLimit - 1,
					width: xLimit + 1,
					height: yLimit + 1
				}).toBuffer());
				if (err) TE(err);

				position = 'bottom-right';
				urls[position] = `https://blurring-images.s3.eu-central-1.amazonaws.com/images-${blurringId}/${position}.${format}`;
				[err] = await to(s3Bucket.putObject({
					Key: `images-${blurringId}/${position}.${format}`,
					Body: Buffer.from(buffer, 'base64'),
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}).promise());
				if (err) TE(err);
				[err] = await to(axios.get(`http://ec2-18-184-231-193.eu-central-1.compute.amazonaws.com/blur/${blurringId}/${position}.${format}`));
				if (err) TE(res, err);

				// Save to Redis
				await redis.set(blurringId, JSON.stringify({
					"original": {...urls, xLimit, yLimit, format },
					"blurred": {},
				}));

				return ReS(res, {message: 'Success', blurringId, format});
			})
		} catch (err) {
			console.log(err);
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
	let [err, response] = await to(axios.get('http://ec2-18-184-231-193.eu-central-1.compute.amazonaws.com/blur/yPDBlSH/bottom-left.jpeg'));
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

const list = async function (req, res) {
	let params = {
		Bucket: 'blurring-images', /* required */
		Prefix: 'blurred-1Lq68k2'  // Can be your folder name
	};
	s3Bucket.listObjectsV2(params, function(err, data) {
		if (err) return ReE(res, err);
		return ReS(res, {message: 'Success', data, filesCount: data.Contents.length});
	});
};
module.exports.list = list;


const complete = async function (req, res) {
	const blurringId = req.params.id;
	console.log('ID: ' + blurringId);
	console.log(req.body.event.Records[0].s3.object.key);

	const topLeft = sharp('https://blurring-images.s3.eu-central-1.amazonaws.com/blurring-' + blurringId + '/complete.jpeg');

	let params = {
		Bucket: 'blurring-images', /* required */
		Prefix: 'blurred-' + blurringId  // Can be your folder name
	};
	s3Bucket.listObjectsV2(params, async function(err, s3) {
		if (err) return ReE(res, err);
		redis.get(blurringId, async function (err, data) {

			const xLimit = JSON.parse(data).original.xLimit;
			const yLimit = JSON.parse(data).original.yLimit;
			const format = JSON.parse(data).original.format;

			console.log('REDIS DATA', data);

			let images = [{
				src: 'https://blurring-images.s3.eu-central-1.amazonaws.com/images-' + blurringId + '/original.' + format, x: 0, y: 0
			},{},{},{},{}];
			await asyncForEach(s3.Contents, async (image) => {
				let url = 'https://blurring-images.s3.eu-central-1.amazonaws.com/' + image.Key;
				if (image.Key.indexOf('top-left') !== -1) images[1] = { src: url, x: 0, y: 0 };
				if (image.Key.indexOf('top-right') !== -1) images[2] = { src: url, x: parseInt(xLimit), y: 0 };
				if (image.Key.indexOf('bottom-left') !== -1) images[3] = { src: url, x: 0, y: parseInt(yLimit) };
				if (image.Key.indexOf('bottom-right') !== -1) images[4] = { src: url, x: parseInt(xLimit), y: parseInt(yLimit) };
			});

			console.log(images);

			const mergeImages = require('merge-images');
			const {Canvas,Image} = require('canvas');
			Canvas.Image = Image;
			mergeImages(images, { Canvas: Canvas }).then(async base64 => {
				await s3Bucket.putObject({
					Key: `blurred-${blurringId}/complete.${format}`,
					Body: base64,
					ContentEncoding: 'base64',
					ContentType: 'image/png',
					ACL: 'public-read'
				}, (err) => {
					if (err) TE(err);

					require("fs").writeFile("out.png", base64.replace(/^data:image\/png;base64,/, ""), 'base64', function(err) {
						if (err) console.log(err);
						else console.log("SAVED COMPLETED IMAGE!");
					});

					return ReS(res, {message: 'Complete'});
				});
			});
		});
	});
};
module.exports.complete = complete;

const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.citiesSchema = Joi.object({
        Title: Joi.string().required().escapeHTML(),
        Cost: Joi.number().required().min(0),
        Location: Joi.string().required().escapeHTML(),
        Description: Joi.string().required().escapeHTML().required(),
        deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
        rating: Joi.number().required().min(1).max(5),
        review: Joi.string().required().escapeHTML()
    }).required()


// Joi.object({
//     review: Joi.string().required(),
//     rating: Joi.number().min(0).max(5).required()
// })
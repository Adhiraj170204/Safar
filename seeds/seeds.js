require('dotenv').config();
const safar = require('../model/safar')
let cities = require('./cities')
let { places, descriptors } = require('./title')
const mbxStyles = require('@mapbox/mapbox-sdk/services/geocoding');
const geoCoder = mbxStyles({ accessToken: process.env.Mapbox_Token });


const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/journey', {
})
    .then(() => {
        console.log('Mongo Connection Successful')
    })
    .catch((err) => {
        console.log('Mongo Connection Failed')
        console.log(err)
    })

let gen = (descriptors, places) => {
    let a = Math.floor(Math.random() * 20)
    let b = Math.floor(Math.random() * 20)
    return `${descriptors[a]} ${places[b]}`
}

let seedDB = async () => {
    await safar.deleteMany({})
    for (let i = 0; i < 300; i++) {
        let r = Math.floor(Math.random() * 528)
        let Location = `${cities[r].city}, ${cities[r].state}`
        // let geoData = await geoCoder.forwardGeocode({
        //     query: Location,
        //     limit: 1
        // }).send()
        let seher = new safar({
            Location: Location,
            Title: gen(descriptors, places),
            Description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Animi, enim. Id, vel excepturi architecto porro incidunt magni',
            Cost: r,
            Author: '6796204f878c0eeeb06e5cc2',
            Images: [
                {
                    url: 'https://res.cloudinary.com/dvitogiav/image/upload/v1738273884/samples/balloons.jpg',
                    filename: 'cld-sample-5'
                },
                {
                    url: 'https://res.cloudinary.com/dvitogiav/image/upload/v1738273877/samples/landscapes/beach-boat.jpg',
                    filename: 'cld-sample-2'
                },
                {
                    url: 'https://res.cloudinary.com/dvitogiav/image/upload/v1738273878/samples/landscapes/nature-mountains.jpg',
                    filename: 'cld-sample-4'
                }
            ],
            geometry: {
                type: 'Point',
                coordinates: [cities[r].longitude, cities[r].latitude]
            }

        })
        await seher.save()
    }
}
seedDB()
    .then(() => {
        mongoose.connection.close()
        console.log('hogaya')
    })
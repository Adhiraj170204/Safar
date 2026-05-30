import dotenv from 'dotenv';
import Camp from '../models/camp.js';
import cities from './cities.js';
import { places, descriptors } from './title.js';

import mongoose from 'mongoose';

dotenv.config();

mongoose.connect('mongodb://localhost:27017/Safar', {})
    .then(() => {
        console.log('Mongo Connection Successful');
    })
    .catch((err) => {
        console.log('Mongo Connection Failed');
        console.log(err);
    });

const gen = (descriptors, places) => {
    const a = Math.floor(Math.random() * 20);
    const b = Math.floor(Math.random() * 20);
    return `${descriptors[a]} ${places[b]}`;
};

const seedDB = async () => {
    await Camp.deleteMany({});

    for (let i = 0; i < 30; i++) {
        const r = Math.floor(Math.random() * 528);
        const location = `${cities[r].city}, ${cities[r].state}`;

        const camp = new Camp({
            location,
            title: gen(descriptors, places),
            description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Animi, enim. Id, vel excepturi architecto porro incidunt magni',
            cost: r,
            user: '6913a66d15593c89b496ee7a',
            images: [
                {
                    url: 'https://res.cloudinary.com/dvitogiav/image/upload/v1762441484/wp3273408-ayrton-senna-hd-wallpaper_jaevid.jpg',
                    filename: 'wp3273408-ayrton-senna-hd-wallpaper_jaevid'
                },
                {
                    url: 'https://res.cloudinary.com/dvitogiav/image/upload/v1762441482/wp12428764-max-verstappen-desktop-wallpapers_wtie4o.jpg',
                    filename: 'wp12428764-max-verstappen-desktop-wallpapers_wtie4o'
                },
                {
                    url: 'https://res.cloudinary.com/dvitogiav/image/upload/v1762441482/2025-Formula1-Red-Bull-Racing-RB21-010-1080_wmoaws.jpg',
                    filename: '2025-Formula1-Red-Bull-Racing-RB21-010-1080_wmoaws'
                }
            ],
            geometry: {
                type: 'Point',
                coordinates: [cities[r].longitude, cities[r].latitude]
            }
        });

        await camp.save();
    }
};

seedDB()
    .then(() => {
            mongoose.connection.close();
        console.log('hogaya');
    });
# Safar - Travel Destination Explorer

Safar is a web application that helps users discover, share, and review travel destinations around the world. Users can browse cities, view details on a map, add new destinations, and leave reviews.

![Safar Screenshot](https://res.cloudinary.com/dvitogiav/image/upload/v1738273884/samples/balloons.jpg)

## Features

- **Destination Discovery**: Browse through various cities with location mapping
- **Interactive Maps**: Explore destinations with Mapbox integration
- **User Authentication**: Create an account, log in, and manage your content
- **Image Management**: Upload and view images for each destination
- **Review System**: Leave ratings and reviews for places you've visited
- **Responsive Design**: Access from any device with a mobile-friendly interface

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with local strategy
- **Frontend**: EJS templates, Bootstrap 5
- **Maps**: Mapbox API integration
- **Image Storage**: Cloudinary
- **Security**: Helmet.js, express-mongo-sanitize, JOI validation

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Safar.git
   cd Safar
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   DB_Url=mongodb://localhost:27017/journey
   Secret=your_session_secret
   Cloud_Name=your_cloudinary_cloud_name
   Cloud_API=your_cloudinary_api_key
   Cloud_Secret=your_cloudinary_secret
   Mapbox_Token=your_mapbox_token
   Port=3000
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Visit `http://localhost:3000` in your browser

## Usage

### Browsing Destinations
- Navigate to the Cities page to view all destinations
- Click on any city card to see detailed information
- Explore the interactive map to find destinations by location

### Adding a New Destination
1. Log in to your account
2. Click "Add City" in the navigation
3. Fill out the form with details about the destination
4. Upload images of the location
5. Submit to add your destination to the database

### Leaving Reviews
1. Navigate to a destination page
2. Scroll down to the reviews section
3. Leave a star rating and written review
4. Submit to share your experience

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Mapbox](https://www.mapbox.com/)
- [Cloudinary](https://cloudinary.com/)
- [Passport.js](http://www.passportjs.org/) 
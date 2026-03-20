# DevCamper Backend API Specifications

This project focuses on building the backend API for a bootcamp directory platform. The frontend application is being developed by a separate team, so this repository is solely responsible for the API and server-side functionality.

It is a robust TypeScript implementation of Brad Traversy’s original DevCamper API, which was built in JavaScript. This version significantly expands the original (model → controller → route) structure into a scalable layered architecture: types → models → DTOs → services → controllers → routes.

### Bootcamps
- List all bootcamps in the database
   * Pagination
   * Select specific fields in result
   * Limit number of results
   * Filter by fields
- Search bootcamps by radius from zipcode
  * Use a geocoder to get exact location and coords from a single address field
- Get single bootcamp
- Create new bootcamp
  * Authenticated users only
  * Must have the role "publisher" or "admin"
  * Only one bootcamp per publisher (admins can create more)
  * Field validation via Mongoose
- Upload a photo for bootcamp
  * Owner only
  * Photo will be uploaded to local filesystem
  * Only safe image types are allowed (jpg, jpeg, png, webp)
- Update bootcamps
  * Owner only
  * Validation on update
- Delete Bootcamp
  * Owner only
- Calculate the average cost of all courses for a bootcamp
- Calculate the average rating from the reviews for a bootcamp

### Courses
- List all courses for bootcamp
- List all courses in general
  * Pagination, filtering, etc
- Get single course
- Create new course
  * Authenticated users only
  * Must have the role "publisher" or "admin"
  * Only the owner or an admin can create a course for a bootcamp
  * Publishers can create multiple courses
- Update course
  * Owner only
- Delete course
  * Owner only
  
### Reviews
- List all reviews for a bootcamp
- List all reviews in general
  * Pagination, filtering, etc
- Get a single review
- Create a review
  * Authenticated users only
  * A user can't write a review about their own bootcamp
- Update review
  * Owner only
- Delete review
  * Owner only

### Users & Authentication
- Authentication will be done using JWT/cookies
  * JWT and cookie should expire in X days (can be configured in your .env file)
- User registration
  * Register as a "user" or "publisher"
  * Once registered, the JWT is stored in an HTTP-only cookie
  * The token is NOT exposed in the JSON response body
  * Passwords must be hashed
- User login
  * User can login with email and password
  * Plain text password will compare with stored hashed password
  * Once logged in, the JWT is stored in an HTTP-only cookie
  * The token is NOT exposed in the JSON response body
- User logout
  * Logout clears the authentication cookie
- Get user
  * Route to get the currently logged in user (via token)
- Password reset (lost password)
  * User can request to reset password
  * A hashed token will be emailed to the users registered email address
  * A put request can be made to the generated url to reset password
  * The token will expire after 10 minutes
- Update user info
  * Authenticated user only
  * Separate route to update password
- User CRUD
  * Admin only
- Users can only be made admin by updating the database field manually

## Security
- Encrypt passwords and reset tokens
- Reduce stored XSS risk by sanitizing user-controlled input in DTOs
- Strengthen input validation (e.g., strict email validation)
- Prevent NoSQL injection attacks using express-mongo-sanitize
- Add a rate limit of 100 requests per 15 minutes
- Protect against HTTP parameter pollution (HPP)
- Add secure HTTP headers using Helmet
- Enforce a Content Security Policy (CSP) for defense-in-depth against XSS
- Restrict CORS to trusted frontend origins and allow credentials for cookie-based authentication
- Harden file uploads with:
  - File size limits
  - Safe filename sanitization
  - Strict MIME type validation
  - Strict file extension validation
- Store authentication tokens in HTTP-only cookies (not accessible via JavaScript)
- Use SameSite cookies to mitigate CSRF attacks
- Protect state-changing requests against CSRF using SameSite cookies, trusted-origin CORS, Origin/Referer checks, and a required custom request header

## Documentation
- Use Postman to create documentation
- Use docgen to create HTML files from Postman
- Add html files as the / route for the api

## Brad Traversy's Suggested Deployment (Digital Ocean)
- Push to Github
- Create a droplet - https://m.do.co/c/5424d440c63a
- Clone repo on to server
- Use PM2 process manager
- Enable firewall (ufw) and open needed ports
- Create an NGINX reverse proxy for port 80
- Connect a domain name
- Install an SSL using Let's Encrypt
## Getting Started

To start the application, follow these steps:

1. Make sure you have Node.js and npm installed on your machine.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the application:

   ```bash
   npm start
   ```

This will launch the application in your default web browser.

### Blocking Categories

You can block specific categories for scraping by running:

```bash
npm run blocked Coles "Back-to-School"
npm run blocked Woolworths "Easter"
```

These commands will update your blocked categories configuration before scraping.

### Getting Cookies

To fetch and store cookies necessary for scraping, run:

```bash
npm run get:cookies
```


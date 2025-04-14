# JSON Server for Frontend Testing

This is a JSON Server project configured for testing frontend applications. It provides a set of REST API endpoints for managing brands, categories, displays, and media uploads (images). The server is built using [json-server](https://github.com/typicode/json-server) along with [Express](https://expressjs.com) and middleware for file uploads and image processing.

## Getting Started

First, clone the repository:

```bash
git clone https://github.com/Arcadio-1/TestServer.git
cd your-jsonserver-repo
```

Then, install the dependencies:

```
npm install
```

Start the server by running:

```
npm start

```

The server will run on http://localhost:8000 by default.

## API Endpoints

### Brands

##### Get Brands

Method: GET
URL: http://localhost:8000/brands

### Categories

#### Get Category List

Method: GET
URL: http://localhost:8000/category

#### Get a Category Item

Method: GET
URL: http://localhost:8000/category/:id
(Replace :id with the actual category ID.)

#### Create a Category Item

Method: POST
URL: http://localhost:8000/category

#### Edit a Category Item

Method: PATCH
URL: http://localhost:8000/category/:id

#### Delete a Category Item

Method: DELETE
URL: http://localhost:8000/category/:id

### Displays

#### Create a Display

Method: POST
URL: http://localhost:8000/generateDisplay

This endpoint creates a default display item and returns its ID.

#### Get Displays List (with Optional Filtering)

Method: GET
URL: http://localhost:8000/displays
(You can append query parameters, e.g., ?categoryId=1234 for filtering.)

#### Edit a Display Item

Method: PATCH
URL: http://localhost:8000/displays/:id

#### Delete Display(s)

Method: POST
URL: http://localhost:8000/deleteDisplays
Request Body (JSON):

```
{
  "displayIds": [
    "display1744591988175",
    "display1744593154765"
  ]
}
<!-- This endpoint deletes all displays whose IDs match any in the provided array. -->
```

### Media / Uploads

#### Get Uploaded Media

Method: GET
URL: http://localhost:8000/getMedias/:displayId
(Returns all media entries for the given display ID.)

#### Upload Media (Image Only)

Method: POST
URL: http://localhost:8000/upload/:displayId
Notes:

Expects a multipart/form-data POST with a file field named "file".

The image is saved in the uploads folder, and a thumbnail is generated automatically.

Media metadata is stored in the database.

#### Delete a Media Item

Method: DELETE
URL: http://localhost:8000/deleteMedia/:uid
Notes:

The :uid parameter corresponds to the unique filename (UID) of the media entry.

This endpoint deletes the media file and its thumbnail from the uploads folder and removes the associated record from the database.

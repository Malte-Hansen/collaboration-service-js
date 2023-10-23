## Description

Re-engineered Collaboration Service. The corresponding frontend branch is availabe [here](https://git.se.informatik.uni-kiel.de/ExplorViz/code/frontend/-/tree/socketio?ref_type=heads).

## Installation

- `git clone <repository-url>` this repository
- `cd collaboration-service-scalable`
- `npm install`

## Running / Development

- Start local Redis instance: `docker compose up -d`
- Start application: `npm run start`

## Testing

- Start local Redis instance: `docker compose up -d`
- Start application: `npm run start`
- Start tests: `npm run test:supertest`

## Building

- Execute `npm run build`

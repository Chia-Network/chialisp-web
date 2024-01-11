# Website

This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator, and deployed with Github Pages.

### Installation

```
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Serve

```
$ npm run serve
```

This command serves the static content in the `build` directory.

### Commands run in github CI

These are the commands being run in the github CI, run them all locally in this order to ensure there are no issues building and serving the content prior to submitting a pr:

```
$ npm install
$ npm ci
$ npm run build
$ npm run serve
```
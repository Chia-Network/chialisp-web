# Website

This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install --local yarn
$ ./node_modules/yarn/bin/yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

### Docker Local Development

```
$ docker-compose up
```

You can also install and start local development server using Docker.

### Local Development notes

`yarn` & `docusaurus` interpret text within angle-brackets, so be careful when using them, if you are editing the .md files directly.

If you are logged in to your github account, you can edit a page right on chialisp.com, by clicking on the "Edit this page" link at the bottom of the article. That will allow you to edit the page, and submit a pull request against the underlying markdown file.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

```
$ GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

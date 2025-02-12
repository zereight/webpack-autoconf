/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
const path = require(`path`);

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;
  const page = path.resolve(`src/pages/index.js`);
  createPage({
    path: `/webpack`,
    matchPath: "/webpack/*",
    component: page,
    context: {
      selectedTab: 'webpack',
    },
  });

  createPage({
    path: `/parcel`,
    matchPath: "/parcel/*",
    component: page,
    context: {
      selectedTab: 'parcel',
    },
  });

  createPage({
    path: `/snowpack`,
    matchPath: "/snowpack/*",
    component: page,
    context: {
      selectedTab: 'snowpack',
    },
  });
};
/*
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions

  if (page.path.match(/^\/webpack/)) {
    page.matchPath = "/webpack/*"

    createPage(page)
  }
}*/
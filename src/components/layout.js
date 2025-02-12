import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { StaticQuery, graphql, Link } from 'gatsby';

import * as styles from '../styles.module.css';
import './layout.css';

const Header = () => {
  return (
    <div className={styles.header}>
      <Link to="/" className="header-link">
        <h1>Create App</h1>
      </Link>
      <h2 className="main-subheader">Frontend build config generator</h2>
    </div>
  );
};

const Layout = ({ children, title, metaDescription, hideHeader }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `}
    render={(data) => (
      <>
        <Helmet
          title={title || data.site.siteMetadata.title}
          meta={[
            {
              name: 'description',
              content: metaDescription || data.site.siteMetadata.description,
            },
            {
              name: 'google-site-verification',
              content: 'UOjML_KiDFBKebmkb_ybTNcwQaEq3DIW-f7EIzCFo08',
            },
          ]}
        >
          <script async defer src="https://buttons.github.io/buttons.js" />
          <script
            async
            defer
            type="text/javascript"
            src="https://transactions.sendowl.com/assets/sendowl.js"
          />
          <html lang="en" />
        </Helmet>

        {hideHeader ? null : <Header />}
        <div>{children}</div>
        <footer>
          <br />
          <br />
          <br />
          <ul
            style={{
              display: `flex`,
              flexWrap: `wrap`,
              justifyContent: `space-around`,
              listStyle: `none`,
              color: 'black',
              maxWidth: '517px',
              margin: 'auto',
            }}
          >
            <li>
              <Link to="/webpack-course">Free webpack course</Link>
            </li>
            <Link to="/webpack-book">Webpack book</Link>
            <a href="http://blog.jakoblind.no/webpack/">Articles</a>
            <Link to="/about">About</Link>
          </ul>
          <ul
            style={{
              display: `flex`,
              flexWrap: `wrap`,
              justifyContent: `space-around`,
              listStyle: `none`,
              color: 'black',
              width: '390px',
              margin: '30px auto',
            }}
          >
            <li>
              <a href="https://twitter.com/karljakoblind">Twitter</a>
            </li>
            <li>
              <a href="https://spectrum.chat/createapp-dev">Community</a>
            </li>

            <li>
              <a href="https://github.com/jakoblind">GitHub</a>
            </li>
            <li>
              <a
                className="github-button"
                href="https://github.com/jakoblind/webpack-autoconf/issues"
                aria-label="Issue jakoblind/webpack-autoconf on GitHub"
              >
                Issue
              </a>
            </li>
          </ul>
        </footer>
      </>
    )}
  />
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  metaDescription: PropTypes.string,
};

Layout.defaultProps = {
  title: '',
  metaDescription: '',
};

export default Layout;

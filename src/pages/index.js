import React, { useState, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import flow from 'lodash/fp/flow';
const map = require('lodash/fp/map').convert({ cap: false });
import reject from 'lodash/fp/reject';
const reduce = require('lodash/fp/reduce').convert({ cap: false });
import merge from 'lodash/fp/merge';
import split from 'lodash/fp/split';
import { Link } from 'gatsby';
import jszip from 'jszip';
import Joyride from 'react-joyride';
import { saveAs } from 'file-saver';
import validate from 'validate-npm-package-name';
import { Router } from '@reach/router';
import Modal from '../components/Modal';
import * as styles from '../styles.module.css';
import npmVersionPromise from '../fetch-npm-version';

import { CourseSignupForm } from '../components/SignupForms';
import webpackImg from '../../images/webpack-logo.png';
import webpackImgColor from '../../images/webpack-logo-color.png';
import parcelImg from '../../images/parcel-logo.png';
import parcelImgColor from '../../images/parcel-logo-color.png';
import snowpackImg from '../../images/snowpack-logo.png';
import snowpackImgColor from '../../images/snowpack-logo-color.png';
import zipImg from '../../images/zip.svg';

import {
  webpackConfig,
  parcelConfig,
  snowpackConfig,
} from '../configurator/configurator-config';

import {
  createBabelConfig,
  getNpmDependencies,
  getDefaultProjectName,
} from '../configurator/configurator';

import FileBrowser from '../components/FileBrowser';

import Layout from '../components/layout';
import Features, {
  selectionRules as allSelectionRules,
  FeatureHelp,
} from '../components/configurator/Features';
import generateProject, {
  generateParcelProject,
  generateSnowpackProject,
} from '../configurator/project-generator';

import onboardingHelp from '../onboardingHelp';
import DocsViewer from '../components/DocsViewer';
import { trackPageView, gaSendEvent } from '../googleAnalytics';

const StepByStepArea = ({ features, newBabelConfig, isReact, bundler }) => {
  const isWebpack = bundler === 'webpack';
  let config = webpackConfig;
  if (bundler === 'parcel') {
    config = parcelConfig;
  } else if (bundler === 'snowpack') {
    config = snowpackConfig;
  }
  const newNpmConfig = getNpmDependencies(config, features);

  const npmInstallCommand = _.isEmpty(newNpmConfig.dependencies)
    ? ''
    : `\nnpm install ${newNpmConfig.dependencies.join(' ')}`;
  const npmCommand = `mkdir myapp\ncd myapp\nnpm init -y\nnpm install --save-dev ${newNpmConfig.devDependencies.join(
    ' '
  )}${npmInstallCommand}`;
  const isTypescript = _.includes(features, 'typescript');

  let babelStep = null;
  if (newBabelConfig) {
    babelStep = (
      <div>
        <li>
          Create <i>.babelrc</i> in the root and copy the contents of the
          generated file
        </li>
      </div>
    );
  } else if (isTypescript) {
    // currently, you cannt use both typescript and babel.
    // if typescript is selected you must have a tsconf
    babelStep = (
      <div>
        <li>
          Create <i>tsconfig.json</i> in the root and copy the contents of the
          generated file
        </li>
      </div>
    );
  }
  let webpackStep = null;
  if (isWebpack) {
    webpackStep = (
      <li>
        Create <i>webpack.config.js</i> in the root and copy the contents of the
        generated file
      </li>
    );
  }

  const srcFoldersStep = (
    <li>Create folders src and dist and create source code files</li>
  );

  return (
    <div className={styles.rightSection}>
      <div>
        <h3>How to create your project yourself</h3>
        <ol>
          <li>Create an NPM project and install dependencies</li>
          <textarea
            aria-label="npm commands to install dependencies"
            readOnly
            rows="6"
            cols="50"
            value={npmCommand}
          />
          {webpackStep}

          {babelStep}
          {srcFoldersStep}
        </ol>
        {isWebpack ? (
          <Link to="/webpack-course">Need more detailed instructions?</Link>
        ) : null}
      </div>
    </div>
  );
};

StepByStepArea.propTypes = {
  features: PropTypes.arrayOf(PropTypes.string).isRequired,
  newBabelConfig: PropTypes.string,
  isReact: PropTypes.bool.isRequired,
  bundler: PropTypes.string.isRequired,
};

StepByStepArea.defaultProps = {
  newBabelConfig: null, // createBabelConfig function returns null if babel is not selected
};

function Tabs({ selected, setSelected }) {
  return (
    <div className={styles.tabsContainer} id="tabs">
      <nav className={styles.tabs}>
        <button
          onClick={() => setSelected('webpack')}
          className={[
            selected === 'webpack' ? styles.selectedTab : null,
            styles.webpackTab,
          ].join(' ')}
        >
          <img
            alt="webpack logo"
            src={selected === 'webpack' ? webpackImgColor : webpackImg}
          />
          <div>webpack</div>
        </button>
        <button
          onClick={() => setSelected('parcel')}
          className={[
            selected === 'parcel' ? styles.selectedTab : null,
            styles.parcelTab,
          ].join(' ')}
        >
          <img
            alt="parcel logo"
            src={selected === 'parcel' ? parcelImgColor : parcelImg}
          />
          <div>Parcel</div>
        </button>

        <button
          onClick={() => setSelected('snowpack')}
          className={[
            selected === 'snowpack' ? styles.selectedTab : null,
            styles.snowpackTab,
          ].join(' ')}
        >
          <img
            alt="snowpack logo"
            src={selected === 'snowpack' ? snowpackImgColor : snowpackImg}
          />
          <div>Snowpack</div>
        </button>
      </nav>
    </div>
  );
}

Tabs.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};

Modal.setAppElement('#___gatsby');

function DownloadButton({ url, onClick, filename, buildTool }) {
  const [modalOpen, setModalOpen] = useState(false);
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };

  return (
    <div>
      <button
        className={styles.btn}
        onClick={() => {
          onClick();
          if (buildTool === 'webpack') {
            setModalOpen(true);
          }
        }}
        id="download"
      >
        <img alt="zip file" className={styles.icon} src={zipImg} />
        <span>Download project</span>
      </button>
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <h2 style={{ width: '90%', float: 'left' }}>Downloading...</h2>
        <button
          style={{ borderRadius: '100px', float: 'left' }}
          onClick={() => setModalOpen(false)}
        >
          X
        </button>
        <br />
        <br />
        <p>Enjoy your newly created {buildTool} project!</p>

        <h3>Learn webpack with my free email course</h3>
        <div>
          <p>You get 5 emails in 5 days.</p>
          <ul>
            <li>Lesson 1: What does webpack do? (an overview)</li>
            <li>Lesson 2: Create your first webpack project</li>
            <li>Lesson 3: The webpack.config.js and Babel</li>
            <li>Lesson 4: Create a React app with webpack</li>
            <li>Lesson 5: Styling with webpack</li>
          </ul>
        </div>
        <p>Level up your frontend skills and create awesome apps</p>
        <CourseSignupForm tags={917914} />
      </Modal>
    </div>
  );
}

DownloadButton.propTypes = {
  url: PropTypes.string,
  filename: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  buildTool: PropTypes.string.isRequired,
};

DownloadButton.defaultProps = {
  url: '',
};

const selectionRules = {
  stopSelectFunctions: [
    allSelectionRules.stopSelectFunctions.stopIfNotBabelOrTypescriptForReact,
  ],
  additionalSelectFunctions: [
    allSelectionRules.additionalSelectFunctions.enforceMainLibrary,
    allSelectionRules.additionalSelectFunctions.addBabelIfReact,
    allSelectionRules.additionalSelectFunctions.addOrRemoveReactHotLoader,
    allSelectionRules.additionalSelectFunctions.addCssIfPostCSS,
    allSelectionRules.additionalSelectFunctions.addCopyPluginIfCleanPlugin,
    allSelectionRules.additionalSelectFunctions.removeEslintIfTypscript,
    allSelectionRules.additionalSelectFunctions
      .addHTMLWebpackPluginIfCodeSplitVendors,
    allSelectionRules.additionalSelectFunctions.addPostCSSandCSSIfTailwindCSS,
    allSelectionRules.additionalSelectFunctions.removeMaterialIfNotReact,
    allSelectionRules.additionalSelectFunctions.addCSSifBootstrap,
  ],
};

const parcelSelectionRules = {
  stopSelectFunctions: [
    allSelectionRules.stopSelectFunctions.stopIfNotBabelOrTypescriptForReact,
  ],
  additionalSelectFunctions: [
    allSelectionRules.additionalSelectFunctions.enforceMainLibrary,
    allSelectionRules.additionalSelectFunctions.addBabelIfReact,
    allSelectionRules.additionalSelectFunctions.addPostCSSandCSSIfTailwindCSS,
    allSelectionRules.additionalSelectFunctions.removeMaterialIfNotReact,
  ],
};

const snowpackSelectionRules = {
  stopSelectFunctions: [],
  additionalSelectFunctions: [
    allSelectionRules.additionalSelectFunctions.enforceMainLibrary,
    allSelectionRules.additionalSelectFunctions.addCssIfPostCSS,
    allSelectionRules.additionalSelectFunctions.addPostCSSandCSSIfTailwindCSS,
  ],
};

const buildConfigConfig = {
  webpack: {
    featureConfig: webpackConfig,
    projectGeneratorFunction: generateProject,
    defaultFile: 'webpack.config.js',
    selectionRules,
    extraElements: [
      <br key={1} />,
      <Link key={2} to="/webpack-course">
        Free webpack course
      </Link>,
      <br key={3} />,
    ],
  },
  parcel: {
    featureConfig: parcelConfig,
    projectGeneratorFunction: generateParcelProject,
    defaultFile: 'package.json',
    selectionRules: parcelSelectionRules,
    extraElements: [
      <br key={1} />,
      <Link key={2} to="/parcel-course">
        Free parcel course
      </Link>,
      <br key={3} />,
    ],
  },
  snowpack: {
    featureConfig: snowpackConfig,
    projectGeneratorFunction: generateSnowpackProject,
    defaultFile: 'package.json',
    selectionRules: snowpackSelectionRules,
    extraElements: [],
  },
};

const initialState = (selectedTab = 'webpack', initFeatures) => {
  const initFeaturesArray = flow(split('--'), reject(_.isEmpty))(initFeatures);

  const validFeatures = _.keys(
    buildConfigConfig[selectedTab].featureConfig.features
  );
  const initFeaturesArrayOnlyApplicable = _.intersection(
    initFeaturesArray,
    validFeatures
  );

  const initFeaturesOnlyApplicableObject = flow(
    map(f => ({ [f]: true })),
    reduce(merge, [])
  )(initFeaturesArrayOnlyApplicable);

  return {
    selectedTab,
    selectedFeatures: _.isEmpty(initFeaturesOnlyApplicableObject)
      ? { 'no-library': true }
      : initFeaturesOnlyApplicableObject,
  };
};

function reducer(state, action) {
  switch (action.type) {
    case 'setSelectedTab':
      const newAllPossibleFeatures = _.keys(
        buildConfigConfig[action.selectedTab].featureConfig.features
      );

      let shouldSetNoLibrary = state.selectedFeatures['no-library'];

      if (action.selectedTab === 'parcel' && state.selectedFeatures.svelte) {
        // Svelte was selected when switching to the parcel tab
        // which isn't supported so we set the flag shouldSetNoLibrary to
        // true so main library switches to "no-library"
        shouldSetNoLibrary = true;
      }

      const filteredFeatures = _.mapValues(
        state.selectedFeatures,
        (selected, feature) =>
          _.includes(newAllPossibleFeatures, feature) && selected
      );

      let shouldSetBabel = filteredFeatures.babel;
      if (
        (action.selectedTab === 'webpack' || action.selectedTab === 'parcel') &&
        state.selectedFeatures.react
      ) {
        // React was selected when switching to the webpack tab
        // if we come from snowpack, then babel is not set.
        // it must be set if React should work properly
        shouldSetBabel = true;
      }

      if (
        action.selectedTab === 'snowpack' &&
        (state.selectedFeatures.vue || state.selectedFeatures.svelte)
      ) {
        // if we select snowpack, and vue was selected, then we must select no lib
        shouldSetNoLibrary = true;
      }

      return {
        ...state,
        selectedTab: action.selectedTab,
        selectedFeatures: {
          ...filteredFeatures,
          babel: shouldSetBabel,
          'no-library': shouldSetNoLibrary,
        },
      };
    case 'setSelectedFeatures':
      const setToSelected = !state.selectedFeatures[action.feature];
      // logFeatureClickToGa(feature, setToSelected)

      const selectedFeature = {
        ...state.selectedFeatures,
        [action.feature]: setToSelected,
      };

      if (
        _.some(
          _.map(
            buildConfigConfig[state.selectedTab].selectionRules
              .stopSelectFunctions,
            fn => fn(selectedFeature, action.feature, setToSelected)
          )
        )
      ) {
        return state;
      }

      const newSelected = _.reduce(
        buildConfigConfig[state.selectedTab].selectionRules
          .additionalSelectFunctions,
        (currentSelectionMap, fn) =>
          fn(currentSelectionMap, action.feature, setToSelected),
        selectedFeature
      );
      return { ...state, selectedFeatures: newSelected };

    default:
      throw new Error();
  }
}

function trackDownload(selectedTab, selectedFeatures) {
  gaSendEvent({
    eventCategory: 'Project download',
    eventAction: selectedTab,
    eventLabel: JSON.stringify(selectedFeatures),
  });
}

function trackHelpClick(eventAction) {
  gaSendEvent({
    eventCategory: 'Help clicked',
    eventAction,
  });
}

function getSelectedArray(o) {
  return flow(
    map((v, k) => {
      return v ? k : null;
    }),
    reject(_.isEmpty)
  )(o);
}

function Configurator(props) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState(props.selectedTab, props.urlId)
  );
  useEffect(() => {
    const selectedArray = getSelectedArray(state.selectedFeatures);
    const mainLibs = _.remove(selectedArray, i =>
      _.includes(['react', 'vue', 'svelte', 'no-library'], i)
    );
    const path = _.join(_.sortBy(selectedArray), '--');
    const newUrl = `/${state.selectedTab}/${_.kebabCase(mainLibs)}${
      path ? '--' + path : ''
    }`;
    //trackPageView(newUrl);
    window.history.replaceState(null, null, newUrl);
  }, [state.selectedFeatures]);
  const [hoverFeature, setHoverFeature] = useState('');
  const [projectName, setProjectName] = useState('empty-project');

  const {
    featureConfig,
    projectGeneratorFunction,
    defaultFile,
  } = buildConfigConfig[state.selectedTab];

  const selectedArray = getSelectedArray(state.selectedFeatures);

  function onMouseEnterFeature(feature) {
    setHoverFeature(feature);
  }
  function onMouseLeaveFeature() {
    setHoverFeature(null);
  }

  function validateProjectName(name) {
    // TODO
    // Consider splitting project name and directory name
    // into separate fields to not restrict npm package
    // names from using / and possibly other characters.

    // Whitelist allowed characters and only accept those
    // to prevent use of characters that isn't allowed in
    // directory names.
    // Valid characters:
    //  * a-z
    //  * 0-9
    //  * underscore _
    //  * dash -
    //  * dot .
    //
    // Uppercase letters not whitelisted because it's not valid
    // in npm package names
    const whitelistRegex = /^[a-z0-9_.-]+$/;
    const isValidCharacters = whitelistRegex.test(name);
    if (!isValidCharacters && name) return;

    // Use validation function from third party library
    // to check if the name is a valid npm package name.
    // The whitelist above only makes sure that no invalid
    // characters for directory names is present in the name
    // so this is needed too because the project name is used
    // as both the directory name and in package.json
    const isValidNpmPackage = validate(name);
    if (isValidNpmPackage) {
      // All validation succeeded so we set the new project name
      setProjectName(name);
    }
  }

  function downloadZip() {
    projectGeneratorFunction(
      selectedArray,
      projectName,
      npmVersionPromise
    ).then(res => {
      const zip = new jszip();
      _.forEach(res, (content, file) => {
        zip.file(file, content);
      });

      zip.generateAsync({ type: 'blob' }).then(function(blob) {
        saveAs(
          blob,
          `${projectName ||
            getDefaultProjectName('empty-project', selectedArray)}.zip`
        );
      });
    });
  }

  const newBabelConfig = createBabelConfig(selectedArray);

  const isReact = _.includes(selectedArray, 'react');
  const isTypescript = _.includes(selectedArray, 'typescript');

  const showFeatures = _.clone(featureConfig.features);

  if (!isReact) {
    delete showFeatures['react-hot-loader'];
    delete showFeatures['material-ui'];
  }

  if (isTypescript) {
    delete showFeatures.eslint;
  }

  return (
    <div>
      <Tabs
        selected={state.selectedTab}
        setSelected={selectedTab => {
          const newUrl = `/${selectedTab}`;
          trackPageView(newUrl);
          // url is changed when state changes so no need to do it here
          //window.history.replaceState(null, null, newUrl);

          dispatch({ type: 'setSelectedTab', selectedTab });
        }}
      />

      <div className={styles.mainContainer}>
        <div className={styles.featuresContainer}>
          <Features
            features={showFeatures}
            selected={state.selectedFeatures}
            setSelected={feature => {
              dispatch({ type: 'setSelectedFeatures', feature });
            }}
            onMouseEnter={onMouseEnterFeature}
            onMouseLeave={onMouseLeaveFeature}
            selectedBuildTool={state.selectedTab}
          />
          <div className={styles.desktopOnly}>
            <div className={styles.projectNameHelp}>
              <label className={styles.projectName} htmlFor="project-name">
                Project name
              </label>
              <FeatureHelp
                featureName="project name"
                selectedBuildTool={state.selectedTab}
              />
            </div>
            <input
              type="text"
              id="project-name"
              name="project-name"
              value={projectName}
              onChange={e => validateProjectName(e.target.value)}
              className={styles.projectNameInput}
            />
            <DownloadButton
              buildTool={state.selectedTab}
              filename={`${projectName}.zip`}
              onClick={e => {
                downloadZip();
                trackDownload(state.selectedTab, selectedArray);
              }}
            />
          </div>
          {buildConfigConfig[state.selectedTab].extraElements}
          <br />
        </div>
        <div className={styles.codeContainer}>
          <FileBrowser
            projectGeneratorFunction={projectGeneratorFunction}
            featureConfig={featureConfig}
            features={selectedArray}
            highlightFeature={hoverFeature}
            defaultFile={defaultFile}
            projectName={projectName}
          />
          <br />
          <div className={styles.smallScreensOnly}>
            <div className={styles.projectNameHelp}>
              <label
                className={styles.projectName}
                htmlFor="project-name-small"
              >
                Project name
              </label>
              <FeatureHelp
                featureName="project name"
                selectedBuildTool={state.selectedTab}
              />
            </div>
            <input
              type="text"
              id="project-name-small"
              name="project-name"
              value={projectName}
              onChange={e => validateProjectName(e.target.value)}
              className={styles.projectNameInput}
            />
            <DownloadButton
              buildTool={state.selectedTab}
              filename={`${projectName}.zip`}
              onClick={e => {
                downloadZip();
                trackDownload(state.selectedTab, selectedArray);
              }}
            />
          </div>
        </div>
      </div>
      <DocsViewer
        hoverFeature={hoverFeature}
        selectedFeatures={selectedArray}
        buildTool={state.selectedTab}
      />
      <div className={styles.container} id="step-by-step-instructions">
        <StepByStepArea
          features={selectedArray}
          newBabelConfig={newBabelConfig}
          isReact={isReact}
          bundler={state.selectedTab}
        />
      </div>
    </div>
  );
}

Configurator.propTypes = {
  selectedTab: PropTypes.string,
  urlId: PropTypes.string,
};

Configurator.defaultProps = {
  selectedTab: 'webpack',
  urlId: '',
};

export class App extends React.Component {
  joyrideCallback({ lifecycle, step: { target } }) {
    if (lifecycle === 'tooltip') {
      trackHelpClick(target);
    }
  }

  render() {
    const {
      pageContext: { selectedTab },
    } = this.props;

    return (
      <Layout>
        <Joyride
          steps={onboardingHelp}
          continuous
          callback={this.joyrideCallback}
        />
        <Router>
          <Configurator
            path={`${selectedTab}/:urlId`}
            selectedTab={selectedTab}
          />
          <Configurator
            path={`${selectedTab || '/'}`}
            selectedTab={selectedTab}
          />
        </Router>
      </Layout>
    );
  }
}

App.propTypes = {
  pageContext: PropTypes.shape({
    selectedTab: PropTypes.string,
  }),
};

App.defaultProps = {
  pageContext: {
    selectedTab: 'webpack',
  },
};

export default App;

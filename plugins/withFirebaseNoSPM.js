const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFirebaseNoSPM(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes('$RNFirebaseDisableSPM')) {
        podfile = '$RNFirebaseDisableSPM = true\n' + podfile;
      }
      if (!podfile.includes('use_frameworks! :linkage => :static')) {
        podfile = podfile.replace(
          '$RNFirebaseDisableSPM = true\n',
          '$RNFirebaseDisableSPM = true\nuse_frameworks! :linkage => :static\n'
        );
      }

      fs.writeFileSync(podfilePath, podfile);

      const propsPath = path.join(config.modRequest.platformProjectRoot, 'Podfile.properties.json');
      const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
      delete props['ios.useFrameworks'];
      fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

      return config;
    },
  ]);
};

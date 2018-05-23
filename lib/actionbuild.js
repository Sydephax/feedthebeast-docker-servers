var fs = require('fs');
var exec = require('child_process').execSync;
var Action = require('argparse').Action;
var YmlReader = require('./ymlreader');
var util = require('util');
var Handlebars = require('handlebars');
var dockerRepository = 'sydephax';

var ActionBuild = module.exports = function ActionBuild(options) {
	options = options || {};
	template = Handlebars.compile(fs.readFileSync('Dockerfile.template','utf8'));
	setupScriptFile = fs.readFileSync('setup.sh', 'utf8');

	Action.call(this, options);
}
util.inherits(ActionBuild, Action);

function buildModPack(name, data, dynmaps) {
	console.log("## Building "+name);
	var baseDir = 'output/'+name;

	if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

	data.forEach(function(d) {
		var mcVerDir = baseDir+'/'+d.mc_version;
		var packVerDir = mcVerDir+'/'+d.pack_version;
		var dockerfile = packVerDir+'/Dockerfile';
		var setupScript = packVerDir+'/setup.sh';
		var dynMapArg = "";

		if(dynmaps[d.mc_version]) {
			dynMapArg = '--build-arg DYNMAP_URL="'+dynmaps[d.mc_version].url+'" '
		} else {
			console.log("# NO DYMAP VERSION IS AVAILABLE FOR THIS MINECRAFT VERSION")
		}

		d.name = name;

		if (!fs.existsSync(mcVerDir)) fs.mkdirSync(mcVerDir);
		if (!fs.existsSync(packVerDir)) fs.mkdirSync(packVerDir);

		fs.writeFileSync(dockerfile, template(d));
		fs.writeFileSync(setupScript, setupScriptFile);

		tagList = [
			dockerRepository+'/'+name+':'+d.mc_version+'_'+d.pack_version
		];

		if(d.latest && process.env.TRAVIS_BRANCH == 'master') {
			tagList.push(dockerRepository+'/'+name+':latest')
		}

		dockerTags = '--tag '+tagList.join(' --tag ');

		console.log("## Run docker build");
		exec('docker build --rm '+dynMapArg+dockerTags+' '+packVerDir, {stdio:[0,1,2]});

		if(process.env.TRAVIS_BRANCH == 'master') {
			tagList.forEach(function(t) {
				exec('docker push '+t);
			})
		}
	});
}

ActionBuild.prototype.call = function(p, ns, nargs) {
	var reader = new YmlReader();
	var modpacks = [];

	var dynmaps = reader.getDynMapVersions();

	if(nargs != null && nargs.length > 0) {
		for (i = 0; i < nargs.length; ++i) {
			if(reader.getModPacks().indexOf(nargs[i]) == -1) {
				console.log("No such modpack: "+nargs[i]);
				return;
			}
		}
		modpacks = nargs;
	}

	if(modpacks.length == 0)
		modpacks = reader.getModPacks();

	modpackData = reader.get();

	if (!fs.existsSync('output')) fs.mkdirSync('output');
	
	modpacks.forEach(function(m) {
		buildModPack(m, modpackData[m], dynmaps);
	});
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const simple_git_1 = require("simple-git");
const binaryExtensions_json_1 = __importDefault(require("./binaryExtensions.json"));
class Repository {
    gitOptions = {
        baseDir: `${tl.getVariable('System.DefaultWorkingDirectory')}`,
        binary: 'git'
    };
    _repository;
    constructor() {
        this._repository = (0, simple_git_1.simpleGit)(this.gitOptions);
        this._repository.addConfig('core.pager', 'cat');
        this._repository.addConfig('core.quotepath', 'false');
    }
    async GetChangedFiles(fileExtensions, filesToExclude) {
        await this._repository.fetch();
        let targetBranch = this.GetTargetBranch();
        let diffs = await this._repository.diff([targetBranch, '--name-only', '--diff-filter=AM']);
        let files = diffs.split('\n').filter(line => line.trim().length > 0);
        let filesToReview = files.filter(file => !binaryExtensions_json_1.default.includes(file.slice((file.lastIndexOf(".") - 1 >>> 0) + 2)));
        if (fileExtensions) {
            let fileExtensionsToInclude = fileExtensions.trim().split(',');
            filesToReview = filesToReview.filter(file => fileExtensionsToInclude.includes(file.substring(file.lastIndexOf('.'))));
        }
        if (filesToExclude) {
            let fileNamesToExclude = filesToExclude.trim().split(',');
            filesToReview = filesToReview.filter((pathFile) => {
                const file = pathFile.split('/').pop().trim(); //remove o caminho, pegando apenas o nome e extensão do arquivo
                let notIncludeFile = false;
                fileNamesToExclude.forEach((fileToExclude) => {
                    if (file.includes(fileToExclude)) {
                        notIncludeFile = true;
                    }
                });
                if (!notIncludeFile) {
                    return file;
                }
            });
        }
        return filesToReview;
    }
    async GetDiff(fileName) {
        let targetBranch = this.GetTargetBranch();
        let diff = await this._repository.diff([targetBranch, '--', fileName]);
        return diff;
    }
    GetTargetBranch() {
        let targetBranchName = tl.getVariable('System.PullRequest.TargetBranchName');
        if (!targetBranchName) {
            targetBranchName = tl.getVariable('System.PullRequest.TargetBranch')?.replace('refs/heads/', '');
        }
        if (!targetBranchName) {
            throw new Error(`Could not find target branch`);
        }
        return `origin/${targetBranchName}`;
    }
}
exports.Repository = Repository;

#!/bin/sh

# deploys last build result of the current branch to its github page

destinationBranch="gh-pages"
branch=`git rev-parse --abbrev-ref HEAD`
remoteUrl=`git config --get remote.origin.url`
fileToDeploy="dist/chromatone/chromatone-combined-index.html"
repoPath=`mktemp -d`

git clone --depth 1 $remoteUrl -b $destinationBranch $repoPath

# create directory for branch
mkdir -p "$repoPath/$branch"
# and move combined build result into it
cp "$fileToDeploy" "$repoPath/$branch/index.html"
# add changes
cd "$repoPath"
git add "$branch"
# and commit/push them
git commit -m "Update build result of $branch"
git push origin $destinationBranch

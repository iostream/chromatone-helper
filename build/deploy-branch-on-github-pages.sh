#!/bin/sh

# deploys to last combined build to the github page belonging to the current
# branch

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
# and commit them
git commit -m "Update build result of $branch"
git push origin $destinationBranch

#addin Cake.Yarn

var target = Argument("target", "Default");

var sourcesBasePath = "./src";
var clientDir = System.IO.Path.Combine(sourcesBasePath, "Zuehlke.AgilePlaner.Client");

Task("Restore:Client")
  .Does(() =>
{
  Yarn.FromPath(clientDir).Install();
});

Task("Build:Client")
  .IsDependentOn("Restore:Client")
  .Does(() =>
{
  Yarn.FromPath(clientDir).RunScript("start -- build");
});

Task("Build")
  .IsDependentOn("Build:Client")
  .Does(() =>
{
});

Task("Start:Client")
  .IsDependentOn("Restore:Client")
  .Does(() =>
{
  Yarn.FromPath(clientDir).RunScript("start -- serve");
});

Task("Start")
  .IsDependentOn("Start:Client")
  .Does(() =>
{
});

Task("Default")
  .IsDependentOn("Build")
  .Does(() =>
{
});

RunTarget(target);

var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.SupportAgent_ApiService>("apiservice");

builder.AddProject<Projects.SupportAgent_Web>("webfrontend")
    .WithExternalHttpEndpoints()
    .WithReference(apiService)
    .WaitFor(apiService);

builder.Build().Run();

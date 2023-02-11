using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Google.Apis.Auth.OAuth2;

namespace ObtainGAPIKey
{
    public static class ObtainToken
    {
        [FunctionName("ObtainToken")]
        public static async Task<string> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var gapiJson = Environment.GetEnvironmentVariable("GAPIJsonKey");
            var underlyingCredentials = await GoogleCredential.FromJson(gapiJson) // Loads key file
                .CreateScoped("https://www.googleapis.com/auth/spreadsheets") // Gathers scopes requested
                .UnderlyingCredential.GetAccessTokenForRequestAsync();
            return underlyingCredentials;
        }
    }
}

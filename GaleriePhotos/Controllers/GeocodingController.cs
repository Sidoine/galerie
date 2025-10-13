using GaleriePhotos.Models;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Galerie.Server.Controllers
{
    [Authorize(Policy = Policies.Administrator)]
    [Route("api/geocoding")]
    public class GeocodingController : Controller
    {
        private readonly GeocodingService geocodingService;

        public GeocodingController(GeocodingService geocodingService)
        {
            this.geocodingService = geocodingService;
        }

        [HttpPost("address")]
        public async Task<ActionResult<AddressGeocodeResponse>> GeocodeAddress([FromBody] AddressGeocodeRequest request)
        {
            var result = await geocodingService.GeocodeAddressAsync(request.Address);
            return Ok(result);
        }
    }
}
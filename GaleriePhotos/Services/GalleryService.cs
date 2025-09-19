using System.Threading.Tasks;
using GaleriePhotos.Data;
using GaleriePhotos.Models;
using Microsoft.EntityFrameworkCore;

namespace GaleriePhotos.Services;

public class GalleryService
{
    private readonly ApplicationDbContext dbContext;

    public GalleryService(ApplicationDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task<Gallery?> Get(int galleryId)
    {
        return await dbContext.Galleries.Include(x => x.Members).FirstOrDefaultAsync(g => g.Id == galleryId);
    }
}
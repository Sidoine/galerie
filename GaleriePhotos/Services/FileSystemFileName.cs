using System.Threading.Tasks;

namespace GaleriePhotos.Services;

public class FileSystemFileName : IFileName
{
    public string Path { get; set; }

    public bool Exists { get; set; }

    public FileSystemFileName(string path, bool exists)
    {
        Path = path;
        Exists = exists;
    }

    public void Dispose()
    {
    }

    public Task SaveChanges()
    {
        // No action needed for local file system as changes are saved directly to the file.
        return Task.CompletedTask;
    }
}
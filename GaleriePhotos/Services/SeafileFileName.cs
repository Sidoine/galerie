using System.IO;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class SeafileFileName : IFileName
    {
        private readonly SeafileDataProvider dataProvider;
        private readonly string repository;
        private readonly string remotePath;

        public string Path { get; set; }

        public bool Exists { get; set; }

        public SeafileFileName(string localPath, SeafileDataProvider dataProvider, string repository, string remotePath, bool exists)
        {
            this.dataProvider = dataProvider;
            this.repository = repository;
            this.remotePath = remotePath;
            Path = localPath;
            Exists = exists;
        }

        public void Dispose()
        {
            File.Delete(Path);
        }

        public async Task SaveChanges()
        {
            var bytes = File.ReadAllBytes(Path);
            await dataProvider.WriteFileBytesAsync(repository, remotePath, bytes);
            Exists = true;
        }
    }
}
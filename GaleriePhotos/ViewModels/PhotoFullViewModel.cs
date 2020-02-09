namespace Galerie.Server.ViewModels
{
    public class PhotoFullViewModel
    {
        public string Path { get; set; }
        public string DirectoryPath { get; set; }
        public string Name { get; set; }
        public string Url { get; set; }

        public PhotoFullViewModel(string path, string directoryPath, string name, string url) =>
            (Path, DirectoryPath, Name, Url) = (path, directoryPath, name, url);
    }
}

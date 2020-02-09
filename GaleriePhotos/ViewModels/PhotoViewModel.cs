namespace Galerie.Server.ViewModels
{
    public class PhotoViewModel
    {
        public string Path { get; set; }
        public string Name { get; set; }
        public string Url { get; set; }

        public PhotoViewModel(string path, string name, string url) =>
            (Path, Name, Url) = (path, name, url);
    }
}

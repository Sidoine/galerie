namespace Galerie.Server.ViewModels
{
    public class DirectoryViewModel
    {
        public string Path { get; set; }
        public string Name { get; set; }

        public DirectoryViewModel(string path, string name) =>
            (Path, Name) =  (path, name);
    }
}

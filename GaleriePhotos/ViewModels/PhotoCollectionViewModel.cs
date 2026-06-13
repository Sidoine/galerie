namespace GaleriePhotos.ViewModels
{
    public class PhotoCollectionViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int PhotoCount { get; set; }

        public PhotoCollectionViewModel(int id, string name, int photoCount)
        {
            Id = id;
            Name = name;
            PhotoCount = photoCount;
        }
    }
}
namespace GaleriePhotos.Services
{
    public class SmtpOptions
    {
        public string? Host { get; set; }
        public int Port { get; set; } = 587; // default submission port
        public string? User { get; set; }
        public string? Password { get; set; }
        public string? FromEmail { get; set; }
        public string? FromName { get; set; }
        public bool EnableSsl { get; set; } = true;
    }
}

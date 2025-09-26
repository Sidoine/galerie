using GaleriePhotos.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public class SmtpEmailSender : IEmailSender<ApplicationUser>
    {
        private readonly SmtpOptions _options;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
        {
            return SendEmailAsync(email, "Confirm your email", $"Please confirm your account by <a href='{confirmationLink}'>clicking here</a>.");
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            if (string.IsNullOrWhiteSpace(_options.Host))
            {
                _logger.LogWarning("SMTP host not configured, skipping email to {Email}", email);
                return;
            }
            var fromEmail = _options.FromEmail ?? _options.User ?? "no-reply@example.com";
            var fromName = _options.FromName ?? _options.User ?? "Galerie";

            using var message = new MailMessage();
            message.From = new MailAddress(fromEmail, fromName);
            message.To.Add(email);
            message.Subject = subject;
            message.Body = htmlMessage;
            message.IsBodyHtml = true;

            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };
            if (!string.IsNullOrEmpty(_options.User) && !string.IsNullOrEmpty(_options.Password))
            {
                client.Credentials = new NetworkCredential(_options.User, _options.Password);
            }
            await client.SendMailAsync(message);
        }

        public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
        {
            return SendEmailAsync(email, "Reset your password", $"Your password reset code is: {resetCode}");
        }

        public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
        {
            return SendEmailAsync(email, "Reset your password", $"You can reset your password by <a href='{resetLink}'>clicking here</a>.");
        }
    }
}

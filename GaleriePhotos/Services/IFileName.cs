using System;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public interface IFileName : IDisposable
    {
        string Path { get; }

        bool Exists { get; }

        Task SaveChanges();
    }
}
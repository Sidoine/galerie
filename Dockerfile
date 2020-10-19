FROM mcr.microsoft.com/dotnet/core/sdk:3.1
RUN echo zzz
RUN apt-get update -y
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs ffmpeg

WORKDIR /app

COPY . .
WORKDIR /app/
RUN dotnet publish -c Release -o /output
WORKDIR /output
COPY nginx.conf.sigil .
ENTRYPOINT [ "dotnet", "GaleriePhotos.dll"]

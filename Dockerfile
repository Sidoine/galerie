FROM mcr.microsoft.com/dotnet/sdk:5.0
RUN apt-get update -y
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs ffmpeg
RUN corepack enable 
WORKDIR /app

COPY . .
WORKDIR /app/GaleriePhotos/ClientApp
RUN yarn install
WORKDIR /app/
RUN dotnet restore
RUN dotnet publish -c Release -o /output
WORKDIR /output
COPY nginx.conf.sigil .
ENTRYPOINT [ "dotnet", "GaleriePhotos.dll"]

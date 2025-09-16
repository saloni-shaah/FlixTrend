<<<<<<< HEAD
{ pkgs, ... }: {
  # Use the stable channel for Nix packages
  channel = "stable-24.05";

  # List the packages needed for the development environment
  packages = [
    pkgs.nodejs_20  # Node.js 20
  ];

  # Configure VS Code extensions for the workspace
  idx.extensions = [
    "dbaeumer.vscode-eslint"  # ESLint for code linting
    "esbenp.prettier-vscode" # Prettier for code formatting
  ];

  # Define workspace lifecycle hooks
  idx.workspace = {
    # Commands to run when the workspace is first created
    onCreate = {
      npm-install = "npm install";  # Install npm dependencies
    };
    # Commands to run every time the workspace is (re)started
    onStart = {
      dev-server = "npm run dev";  # Start the Next.js development server
    };
  };

  # Configure a web preview for the application
  idx.previews = {
    enable = true;
    previews = {
      web = {
        # Command to start the web server for the preview
        command = ["npm" "run" "dev" "--" "--port" "$PORT"];
=======
<<<<<<< HEAD
{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
>>>>>>> f431ab7c5d263e8ce359fd2a40007e585780330b
        manager = "web";
      };
    };
  };
}
<<<<<<< HEAD
=======
=======
# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
  ];
  # Sets environment variables in the workspace
  env = {};
  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    # Disabling because we are using prod backends right now
    detect = false;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
>>>>>>> 41a2162a78298df970810cb54c8ed33fc2c24ecf
>>>>>>> f431ab7c5d263e8ce359fd2a40007e585780330b

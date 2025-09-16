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
        manager = "web";
      };
    };
  };
}

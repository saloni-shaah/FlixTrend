{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [ pkgs.nodejs_20 ];
  
  idx.extensions = [ 
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ];

  idx.workspace = {
    onCreate = {
      npm-install = "npm install";
    };
    onStart = {
      dev-server = "npm run dev";
    };
  };

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm", "run", "dev", "--", "--port", "$PORT", "--hostname", "0.0.0.0"];
        manager = "web";
      };
    };
  };
}

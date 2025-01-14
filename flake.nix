{
  description = "smallSolutions personal site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        buildSite = pkgs.writeShellApplication {
          name = "build-site";
          runtimeInputs = [ pkgs.bun pkgs.nodejs_20 ];
          text = ''
            export HOME="$PWD/.tmp-home"
            export BUN_TMPDIR="$PWD/.bun-tmp"
            export BUN_INSTALL="$PWD/.bun-install"
            mkdir -p "$HOME"
            mkdir -p "$BUN_TMPDIR" "$BUN_INSTALL"
            bun install --frozen-lockfile
            bun run build
          '';
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.nodejs_20
          ];
        };

        packages.build = buildSite;
        apps.build = {
          type = "app";
          program = "${buildSite}/bin/build-site";
        };
        apps.default = self.apps.${system}.build;
      });
}

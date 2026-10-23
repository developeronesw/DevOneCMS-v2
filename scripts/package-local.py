"""Package only reproducible local runtime artifacts; never include host data."""
import gzip
import pathlib
import sys
import tarfile

root = pathlib.Path('dist-local')
allowed = {'runtime.mjs', 'bootstrap.mjs', 'web', 'migrations', 'release.json', 'DEVONE-CMS-2.0-LICENSE.md', 'NOTICE.txt'}
if {p.name for p in root.iterdir()} != allowed:
    raise ValueError('unexpected_local_artifacts')
with open(sys.argv[1], 'wb') as output, gzip.GzipFile(fileobj=output, filename='', mtime=0, compresslevel=9) as compressed, tarfile.open(fileobj=compressed, mode='w', format=tarfile.USTAR_FORMAT) as archive:
    for path in [root, *sorted(root.rglob('*'))]:
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise ValueError('unsafe_local_artifact')
        name = 'devone-cms' + (('/' + path.relative_to(root).as_posix()) if path != root else '')
        info = archive.gettarinfo(str(path), arcname=name)
        info.uid = info.gid = info.mtime = 0
        info.uname = info.gname = ''
        info.mode = 0o755 if path.is_dir() else 0o644
        if path.is_file():
            with path.open('rb') as data:
                archive.addfile(info, data)
        else:
            archive.addfile(info)

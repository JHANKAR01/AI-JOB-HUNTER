import os
import json
import subprocess
import tempfile
from jinja2 import Environment, FileSystemLoader

def generate_resume(data_json):
    """
    Hardened Resume Engine
    - Uses Jinja2 for LaTeX templating
    - Compiles via pdflatex with a 30s timeout
    - Aggressive cleanup of temp files
    """
    try:
        data = json.loads(data_json)
        
        # Load LaTeX template (Assumes template.tex is in the same directory)
        env = Environment(
            block_start_string='\BLOCK{',
            block_end_string='}',
            variable_start_string='\VAR{',
            variable_end_string='}',
            comment_start_string='\#{',
            comment_end_string='}',
            line_statement_prefix='%%',
            line_comment_prefix='%#',
            trim_blocks=True,
            autoescape=False,
            loader=FileSystemLoader('.')
        )
        
        template = env.get_loader().get_source(env, 'template.tex')[0]
        rendered_tex = env.from_string(template).render(
            profile=data['profile'],
            summary=data['tailored_summary'],
            bullets=data['tailored_bullets']
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, 'resume.tex')
            with open(tex_path, 'w') as f:
                f.write(rendered_tex)

            # Run pdflatex with 30s timeout
            try:
                subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', 'resume.tex'],
                    cwd=tmpdir,
                    timeout=30,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                # Move the final PDF to the output destination
                output_path = "output_resume.pdf"
                os.rename(os.path.join(tmpdir, 'resume.pdf'), output_path)
                return {"success": True, "path": output_path}
            
            except subprocess.TimeoutExpired:
                return {"success": False, "error": "Compilation timed out after 30s"}
            except subprocess.CalledProcessError as e:
                return {"success": False, "error": f"LaTeX error: {e.stderr.decode()}"}

    except Exception as e:
        return {"success": False, "error": str(e)}

# For local testing
if __name__ == "__main__":
    test_data = '{"profile": {"name": "User"}, "tailored_summary": "Test Summary", "tailored_bullets": ["Point 1"]}'
    print(generate_resume(test_data))
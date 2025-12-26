use nalgebra::DVector;
use nalgebra_sparse::{CsrMatrix, coo::CooMatrix};
use std::f64::consts::PI;
use wasm_bindgen::prelude::*;

// --- Constants ---
const SIGMA_SB: f64 = 5.670374419e-8;

// Material Properties struct
#[derive(Clone, Copy)]
struct Material {
    kt: f64,
    emi: f64,
}

// Fixed materials for the solar cell layers (Top skin)
const MAT_SI: Material = Material {
    kt: 148.0,
    emi: 0.9,
};
const MAT_REF: Material = Material {
    kt: 430.0,
    emi: 0.05,
};

const AG_THICKNESS: f64 = 0.00005;

#[wasm_bindgen]
pub struct SimulationResult {
    t_max: f64,
    p_elec_total: f64,
    t_3d_flat: Vec<f64>,
    nx: usize,
    ny: usize,
    nz: usize,
}

#[wasm_bindgen]
impl SimulationResult {
    pub fn get_t_max(&self) -> f64 {
        self.t_max
    }
    pub fn get_p_elec(&self) -> f64 {
        self.p_elec_total
    }
    pub fn get_t_3d(&self) -> Vec<f64> {
        self.t_3d_flat.clone()
    }
    pub fn get_nx(&self) -> usize {
        self.nx
    }
    pub fn get_ny(&self) -> usize {
        self.ny
    }
    pub fn get_nz(&self) -> usize {
        self.nz
    }
}

fn eta_cell(concentration_suns: f64) -> f64 {
    if concentration_suns <= 0.0 {
        return 0.0;
    }
    let log_c = concentration_suns.log10();
    let eff = (-1.83551021 * log_c.powi(2) + 10.33938856 * log_c + 31.75105977) / 100.0;
    // FIX: Clamp to 0.0 to prevent magic energy creation
    if eff < 0.0 { 0.0 } else { eff }
}

struct RadBoundary {
    idx: usize,
    factor: f64, // Area * Emi * Sigma_SB
}

#[wasm_bindgen]
pub fn run_thermal_simulation(
    fwhm: f64,
    magic_area: f64,
    n_matrix: usize,
    layer_thickness: f64,
    sink_thickness: f64,
    pv_thickness: f64,
    plate_dimension: f64,
    cpv_scale: f64,
    n_xy_param: usize,
    n_z_layer: usize,
    use_circular_cpv: bool,
    use_standard_pv: bool,
    base_kt: f64,
    base_emi: f64,
    sink_kt: f64,
    sink_emi: f64,
    use_fins: bool,
    use_reflector: bool,
    // NEW PARAMETERS
    wind_speed: f64,
    ambient_temp_c: f64,
    q_solar: f64,
) -> SimulationResult {
    // --- 0. Define Dynamic Materials & Temps ---
    let t_infinity_k = ambient_temp_c + 273.15; // Convert input to Kelvin
    let mat_base = Material { kt: base_kt, emi: base_emi };
    let mat_sink = Material { kt: sink_kt, emi: sink_emi };

    // Efficiency Selector Closure
    let calc_efficiency = |suns: f64| -> f64 {
        if use_standard_pv {
            // Standard PV: Fixed ~20% efficiency
            0.20
        } else {
            // CPV: Use the specific curve function defined outside
            eta_cell(suns)
        }
    };

    // --- 1. Grid Setup ---
    let l_xy_total = plate_dimension; 
    let l_xy = l_xy_total / 2.0;
    let l = plate_dimension; 
    
    let l_z_plate = layer_thickness; 
    let l_z_sink = sink_thickness; // Use parameter
    let l_z_total = l_z_plate + l_z_sink;
    let n_xy = n_xy_param; 

    let linspace = |start: f64, end: f64, n: usize| -> Vec<f64> {
        if n == 1 {
            return vec![start];
        }
        let step = (end - start) / (n as f64 - 1.0);
        (0..n).map(|i| start + i as f64 * step).collect()
    };

    let x = linspace(0.0, l_xy, n_xy);
    let dx = x[1] - x[0];
    let y = linspace(0.0, l_xy, n_xy);
    let dy = y[1] - y[0];

    // Z Grid Construction
    let mut z_points = Vec::new();
    
    // Sink Layers: If sink exists, give it some grid points (e.g., 5 points)
    if l_z_sink > 1e-9 {
        z_points.extend(linspace(0.0, l_z_sink, 3));
    } else {
        z_points.push(0.0);
    }

    // Plate Layers
    // Ensure we start the plate layers exactly where the sink ends
    let plate_start = if l_z_sink > 1e-9 { l_z_sink } else { 0.0 };
    z_points.extend(linspace(plate_start, l_z_total - 0.002, n_z_layer));

    // Skin offsets (Thin layers for solar cell / interface)
    let skin_offsets = vec![
        pv_thickness,       // Exact bottom of the PV/Active layer
        AG_THICKNESS,       // Exact bottom of the Reflective coating
        0.0002, 0.0001, 0.0 // Near surface gradients
    ];
    for off in skin_offsets {
        if l_z_total > off {
            z_points.push(l_z_total - off);
        }
    }

    // Sort and Unique (dedup) to handle overlaps at boundaries
    z_points.sort_by(|a, b| a.partial_cmp(b).unwrap());
    z_points.dedup_by(|a, b| (*a - *b).abs() < 1e-12);

    let z = z_points;
    let nz = z.len();
    let n_total = n_xy * n_xy * nz;

    // Volume weights
    let mut wz = vec![0.0; nz];
    let mut dz_intervals = vec![0.0; nz - 1];
    for k in 0..nz - 1 {
        dz_intervals[k] = z[k + 1] - z[k];
    }
    wz[0] = dz_intervals[0] / 2.0;
    for k in 1..nz - 1 {
        wz[k] = (dz_intervals[k - 1] + dz_intervals[k]) / 2.0;
    }
    wz[nz - 1] = dz_intervals[nz - 2] / 2.0;

    // --- 2. CPV Geometry ---
    let spacing = 0.9 * l / (n_matrix as f64);
    let n_cpv_total = n_matrix * n_matrix;
    let mut centers = Vec::with_capacity(n_cpv_total);
    let mut cell_rads = Vec::with_capacity(n_cpv_total);

    for idx_row in 0..n_matrix {
        for idx_col in 0..n_matrix {
            let cx = (idx_col as f64 - (n_matrix as f64 - 1.0) / 2.0) * spacing;
            let cy = (idx_row as f64 - (n_matrix as f64 - 1.0) / 2.0) * spacing;
            centers.push((cx, cy));
            cell_rads.push((cpv_scale * spacing) / 2.0);
        }
    }

    // --- 3. Indexing Helper (Column-Major: Y, X, Z) ---
    // Rust idx = j + i*Ny + k*Ny*Nx (0-based)
    let get_idx =
        |i_x: usize, j_y: usize, k_z: usize| -> usize { j_y + i_x * n_xy + k_z * n_xy * n_xy };

    // Area Accessors matching MATLAB's Wy .* Wz logic
    let get_ax = |j_y: usize, k_z: usize| -> f64 {
        let wy_val = if j_y == 0 || j_y == n_xy - 1 {
            dy / 2.0
        } else {
            dy
        };
        wy_val * wz[k_z]
    };
    let get_ay = |i_x: usize, k_z: usize| -> f64 {
        let wx_val = if i_x == 0 || i_x == n_xy - 1 {
            dx / 2.0
        } else {
            dx
        };
        wx_val * wz[k_z]
    };
    let get_az = |i_x: usize, j_y: usize| -> f64 {
        let wx_val = if i_x == 0 || i_x == n_xy - 1 {
            dx / 2.0
        } else {
            dx
        };
        let wy_val = if j_y == 0 || j_y == n_xy - 1 {
            dy / 2.0
        } else {
            dy
        };
        wx_val * wy_val
    };

    // --- 4. Material Allocation & CPV Coverage (Geometric Anti-Aliasing) ---
    let mut kt_vec = vec![0.0; n_total];
    let mut emi_vec = vec![0.0; n_total]; // We will store this but also use it locally for boundaries
    let mut rad_boundaries = Vec::new();

    // 4a. Calculate Geometric Coverage (0.0 to 1.0)
    // Instead of a boolean mask, we determine the fraction of CPV cell in every grid point.
    let mut cpv_coverage = vec![0.0; n_xy * n_xy];

    // Use 5x5 sub-sampling for high geometric precision
    let sub_n = 5; 
    let sub_step_x = dx / sub_n as f64;
    let sub_step_y = dy / sub_n as f64;
    // Offset to center the sub-grid around the main grid point
    let sub_start_idx = -(sub_n as f64 - 1.0) / 2.0; 

    for i in 0..n_xy {
        for j in 0..n_xy {
            let cx_cell = x[i];
            let cy_cell = y[j];
            let mut hits = 0;
            
            for sx_i in 0..sub_n {
                for sy_i in 0..sub_n {
                    // Calculate sub-pixel world coordinate
                    let sx = cx_cell + (sub_start_idx + sx_i as f64) * sub_step_x;
                    let sy = cy_cell + (sub_start_idx + sy_i as f64) * sub_step_y;
                    
                    let mut inside = false;
                    for p in 0..n_cpv_total {
                        let (ccx, ccy) = centers[p];
                        let radius = cell_rads[p];
                        
                        // Standard check based on shape toggle
                        let is_in = if use_circular_cpv {
                             let dist_sq = (sx - ccx).powi(2) + (sy - ccy).powi(2);
                             dist_sq <= radius.powi(2)
                        } else {
                             let dist_x = (sx - ccx).abs();
                             let dist_y = (sy - ccy).abs();
                             dist_x <= radius && dist_y <= radius
                        };

                        if is_in { inside = true; break; }
                    }
                    if inside { hits += 1; }
                }
            }
            // Store fraction (0.0 = Pure Reflector/Base, 1.0 = Pure Silicon, 0.4 = Edge)
            cpv_coverage[j + i * n_xy] = hits as f64 / (sub_n * sub_n) as f64;
        }
    }

    // 4b. Material Loop with Blending
    // 4b. Material Loop with Blending
    for k in 0..nz {
        for i in 0..n_xy {
            for j in 0..n_xy {
                let idx = get_idx(i, j, k);
                let cz = z[k];
                let xy_idx = j + i * n_xy;
                let cover = cpv_coverage[xy_idx];
                
                // Calculate depth from the top surface
                let depth_from_top = l_z_total - cz;

                // --- Step 1: Determine Background Material ---
                // This determines what exists in the "gaps" or "under" the CPV cells.
                // Priority: Sink (Bottom) -> Silver Layer (Top Surface) -> Base Plate (Default)
                
                let mut k_bg = base_kt;
                let mut emi_bg = base_emi;

                if l_z_sink > 1e-9 && cz <= l_z_sink + 1e-6 {
                    // Region 1: Heat Sink (Bottom)
                    k_bg = sink_kt;
                    emi_bg = sink_emi;
                } else if use_reflector && depth_from_top <= AG_THICKNESS + 1e-9 {
                    // Region 2: Silver Coating (Top Surface Layer)
                    // If reflector is on, the top surface "background" is Silver.
                    k_bg = MAT_REF.kt;
                    emi_bg = MAT_REF.emi;
                }
                // (Else Region 3: Base Plate, using default values)

                // --- Step 2: Apply CPV Overlay (Mixing on Collision) ---
                // If the current point is within the PV thickness, the CPV material 
                // "collides" with the background. We mix them based on coverage.
                
                let (k_final, emi_final) = if l_z_sink > 1e-9 && cz <= l_z_sink + 1e-6 {
                    // Safety: Sink always wins, no CPV in the sink layer
                    (k_bg, emi_bg)
                } else if depth_from_top <= pv_thickness + 1e-9 {
                    // We are inside the Active PV Layer thickness
                    let k_si = MAT_SI.kt;
                    let emi_si = MAT_SI.emi;

                    // Blend: Where cover is 1.0 (Cell), Silicon wins. 
                    // Where cover is 0.0 (Gap), Background (Silver/Base) wins.
                    (
                        cover * k_si + (1.0 - cover) * k_bg,
                        cover * emi_si + (1.0 - cover) * emi_bg
                    )
                } else {
                    // Below the PV layer, we only have the background
                    (k_bg, emi_bg)
                };

                kt_vec[idx] = k_final;
                emi_vec[idx] = emi_final;

                // --- Boundary Identification (Using Blended Emissivity) ---
                let mut is_boundary = false;
                let mut area_acc = 0.0;

                // Top (Z Max)
                if k == nz - 1 {
                    is_boundary = true;
                    area_acc += get_az(i, j);
                }
                // Bottom (Z Min)
                if k == 0 {
                    is_boundary = true;
                    area_acc += get_az(i, j);
                }
                // Right (X Max) -> i = N-1
                if i == n_xy - 1 {
                    is_boundary = true;
                    area_acc += get_ax(j, k);
                }
                // Front (Y Max) -> j = N-1
                if j == n_xy - 1 {
                    is_boundary = true;
                    area_acc += get_ay(i, k);
                }

                if is_boundary {
                    let factor = area_acc * emi_final * SIGMA_SB;
                    rad_boundaries.push(RadBoundary { idx, factor });
                }
            }
        }
    }
    // --- 5. Heat Sources (Blended with Coverage Map) ---
    let q_concentrated = magic_area * q_solar;
    let sigma_g = fwhm / 2.35;
    let a_tot = q_concentrated / (2.0 * PI * sigma_g.powi(2));
    let a_cpv = (1.0 / n_cpv_total as f64) * a_tot;

    let mut q_source_vec = DVector::zeros(n_total);

    // Only apply source at top layer (k = nz-1)
    let k_top = nz - 1;
    for i in 0..n_xy {
        for j in 0..n_xy {
            let idx = get_idx(i, j, k_top);
            let cx = x[i];
            let cy = y[j];
            let cover = cpv_coverage[j + i * n_xy];

            // 1. Calculate Incident Flux (Gaussian) at Center of Grid Point
            let mut q_sum = 0.0;
            for p in 0..n_cpv_total {
                let (ccx, ccy) = centers[p];
                let r2 = (cx - ccx).powi(2) + (cy - ccy).powi(2);
                q_sum += a_cpv * (-r2 / (2.0 * sigma_g.powi(2))).exp();
            }

            // Total Incident Power (Ambient + Concentrated)
            let q_tot = q_solar * 0.1 + q_sum;
            let suns = q_tot / 1000.0;
            
            // 2. Calculate Efficiency at this intensity
            let efficiency = calc_efficiency(suns);

            // 3. Blend Absorbed Heat
            // Path A: If it were pure Silicon (Absorbs what isn't converted to electricity)
            let q_abs_si = q_tot * (1.0 - efficiency);
            
            // Path B: If it were Reflector (or Base)
            let q_abs_ref = if use_reflector {
                q_tot * 0.05 // Reflector absorbs 5%
            } else {
                q_tot // Base absorbs 100% of incident (minus re-radiation handled by boundary)
            };

            // Mix based on coverage fraction
            let q_in = cover * q_abs_si + (1.0 - cover) * q_abs_ref;

            let az_face = get_az(i, j);
            q_source_vec[idx] = q_in * az_face;
        }
    }

    // --- 6. Matrix Assembly (Conduction + Linear Convection) ---
    let mut coo = CooMatrix::new(n_total, n_total);
    let mut b_base = DVector::zeros(n_total);
    b_base += &q_source_vec;

    // Convection Params
    let fin_height = 0.02;
    let fin_thickness = 0.001;
    let fin_spacing = 0.005;

    // Modified Fin Logic: 
    // Force fins off if sink_thickness is 0, otherwise use the passed boolean.
    let effective_use_fins = if l_z_sink <= 1e-9 { false } else { use_fins };

    let fin_area_multiplier = if effective_use_fins {
        // FIX: Add epsilon to prevent floating point floor error (249 vs 250 fins)
        let n_fins_x = ((l_xy_total + 1e-9) / (fin_thickness + fin_spacing)).floor();
        let fin_efficiency = 0.85;
        let a_base = l_xy_total * l_xy_total;
        let a_fin_per_unit = 2.0 * fin_height * l_xy_total;
        let a_fins_total = n_fins_x * a_fin_per_unit;
        let a_total_effective = a_base + fin_efficiency * a_fins_total;
        a_total_effective / a_base
    } else {
        1.0 // No fins -> Area multiplier is 1 (Flat plate)
    };

    let u_air = wind_speed;
    let nu = 1.5e-5;
    let k_air = 0.026;
    let pr: f64 = 0.71;

    let calc_h = |re_l: f64, is_bottom: bool| -> f64 {
        if is_bottom {
            let nu_l: f64 = 0.037 * re_l.powf(0.8) * pr.powf(1.0 / 3.0);
            nu_l * k_air / l_xy_total
        } else {
            let nu_l: f64 = 0.664 * re_l.powf(0.5) * pr.powf(1.0 / 3.0);
            nu_l * k_air / l_xy_total
        }
    };

    let h_top = calc_h(u_air * l_xy_total / nu, false);
    let h_side = calc_h(u_air * l_xy_total / nu, false);
    let h_bottom = calc_h(u_air * l_xy_total / nu, true) * fin_area_multiplier;

    let mut diag_vals_base = vec![0.0; n_total];

    for k in 0..nz {
        for i in 0..n_xy {
            for j in 0..n_xy {
                let curr = get_idx(i, j, k);

                // Helper for connectivity
                let mut add_conn = |next: usize, area: f64, dist: f64| {
                    let k_eff = 2.0 / (1.0 / kt_vec[curr] + 1.0 / kt_vec[next]);
                    let cond = k_eff * area / dist;
                    coo.push(curr, next, -cond);
                    coo.push(next, curr, -cond);
                    diag_vals_base[curr] += cond;
                    diag_vals_base[next] += cond;
                };

                // Y Neighbor (j+1)
                if j < n_xy - 1 {
                    add_conn(get_idx(i, j + 1, k), get_ay(i, k), dy);
                }
                // X Neighbor (i+1)
                if i < n_xy - 1 {
                    add_conn(get_idx(i + 1, j, k), get_ax(j, k), dx);
                }
                // Z Neighbor (k+1)
                if k < nz - 1 {
                    add_conn(get_idx(i, j, k + 1), get_az(i, j), z[k + 1] - z[k]);
                }

                // Convection
                let mut add_h = |h: f64, area: f64| {
                    diag_vals_base[curr] += h * area;
                    b_base[curr] += h * area * t_infinity_k;
                };

                if k == nz - 1 {
                    add_h(h_top, get_az(i, j));
                }
                if k == 0 {
                    add_h(h_bottom, get_az(i, j));
                }
                if i == n_xy - 1 {
                    add_h(h_side, get_ax(j, k));
                }
                if j == n_xy - 1 {
                    add_h(h_side, get_ay(i, k));
                }
            }
        }
    }

    for i in 0..n_total {
        coo.push(i, i, diag_vals_base[i]);
    }
    let l_matrix_base = CsrMatrix::from(&coo);

    // --- 7. NEWTON-RAPHSON SOLVER ---

    let mut t_vec = DVector::from_element(n_total, t_infinity_k);
    let max_newton_iter = 100;
    let tol_abs = 1e-7;

    // Solver Buffers
    let mut r = DVector::zeros(n_total);
    let mut b_rad_val = DVector::zeros(n_total);
    let mut diag_rad_deriv = DVector::zeros(n_total);

    // Extract base diagonal for Jacobi Preconditioner
    let mut base_diag = vec![0.0; n_total];
    for (row_idx, row) in l_matrix_base.row_iter().enumerate() {
        let cols = row.col_indices();
        let vals = row.values();
        for (c, &val) in cols.iter().zip(vals) {
            if *c == row_idx {
                base_diag[row_idx] = val;
                break;
            }
        }
    }

    // Reusable CG buffers
    let mut delta = DVector::zeros(n_total);
    let mut p = DVector::zeros(n_total);
    let mut z_cg = DVector::zeros(n_total);
    let mut ap = DVector::zeros(n_total);
    let mut r_cg = DVector::zeros(n_total);
    let t4_inf = t_infinity_k.powi(4);

    for _iter in 0..max_newton_iter {
        // 1. Calculate Radiation Terms
        b_rad_val.fill(0.0);
        diag_rad_deriv.fill(0.0);

        for rb in &rad_boundaries {
            let t = t_vec[rb.idx];
            let t2 = t * t;
            let t3 = t2 * t;
            let t4 = t3 * t;

            // Matches MATLAB: const * (T_inf^4 - T^4)
            b_rad_val[rb.idx] = rb.factor * (t4_inf - t4);
            // Derivative d(RHS)/dT = -4 * const * T^3
            // Jacobian J = L - d(RHS)/dT = L + 4 * const * T^3
            diag_rad_deriv[rb.idx] = rb.factor * 4.0 * t3;
        }

        // 2. Calculate Residual
        // R = L*T - b_base - b_rad_val
        r = &l_matrix_base * &t_vec;
        r -= &b_base;
        r -= &b_rad_val;

        let res_norm = r.amax();
        if res_norm < tol_abs {
            break;
        }

        // 3. Solve Linear System: J * delta = -R
        // We solve J * delta = r_cg, where r_cg = -R
        delta.fill(0.0);
        r_cg.copy_from(&r);
        r_cg.scale_mut(-1.0);

        // Preconditioned CG Loop
        // Preconditioner M^-1 = 1 / (BaseDiag + RadDeriv)
        for i in 0..n_total {
            let m_val = base_diag[i] + diag_rad_deriv[i];
            z_cg[i] = r_cg[i] / m_val;
        }
        p.copy_from(&z_cg);
        let mut rs_old = r_cg.dot(&z_cg);

        // Tighter Inner Loop Tolerance for precision
        for _cg_it in 0..5000 {
            // Compute A * p (Implicitly)
            // A * p = L_base * p + diag_rad_deriv .* p
            ap = &l_matrix_base * &p;
            for i in 0..n_total {
                ap[i] += diag_rad_deriv[i] * p[i];
            }

            let denom = p.dot(&ap);
            if denom.abs() < 1e-25 {
                break;
            }
            let alpha = rs_old / denom;

            delta.axpy(alpha, &p, 1.0);
            r_cg.axpy(-alpha, &ap, 1.0);

            // High precision exit for inner solver to match MATLAB's '\'
            if r_cg.norm() < 1e-12 {
                break;
            }

            // Preconditioner apply
            for i in 0..n_total {
                let m_val = base_diag[i] + diag_rad_deriv[i];
                z_cg[i] = r_cg[i] / m_val;
            }

            let rs_new = r_cg.dot(&z_cg);
            let beta = rs_new / rs_old;

            let p_clone = p.clone();
            p.copy_from(&z_cg);
            p.axpy(beta, &p_clone, 1.0);
            rs_old = rs_new;
        }

        // 4. Update Solution
        t_vec += &delta;

        // Safety clamp
        for val in t_vec.iter_mut() {
            if *val < 1.0 {
                *val = 273.15;
            }
        }
    }

    // --- 8. Post Processing ---
    let t_celsius: Vec<f64> = t_vec.data.as_vec().iter().map(|&k| k - 273.15).collect();
    let t_max = t_vec.max() - 273.15;

    // Power Calculation: INTEGRATE OVER FULL PLATE
    // Plate goes from -L/2 to +L/2 in both X and Y
    // l_xy passed in is plate_dimension / 2.0 (Half width)
    let n_vis = 200; // High resolution for integration
    let x_vis_lin = linspace(-l_xy, l_xy, n_vis);
    let y_vis_lin = linspace(-l_xy, l_xy, n_vis);
    let dx_vis = x_vis_lin[1] - x_vis_lin[0];
    let dy_vis = y_vis_lin[1] - y_vis_lin[0];
    let da_vis = dx_vis * dy_vis;

    let mut p_elec_total = 0.0;
    
    // Iterate over Full Plate
    for j in 0..n_vis {
        let yv = y_vis_lin[j];
        for i in 0..n_vis {
            let xv = x_vis_lin[i];
            
            let mut is_cpv = false;
            // Check against ALL cells
            for p in 0..n_cpv_total {
                let (ccx, ccy) = centers[p];
                let radius = cell_rads[p];
                let dist_x = (xv - ccx).abs();
                let dist_y = (yv - ccy).abs();

                let is_in_shape = if use_circular_cpv {
                    (dist_x * dist_x) + (dist_y * dist_y) <= (radius * radius)
                } else {
                    dist_x <= radius && dist_y <= radius
                };

                if is_in_shape {
                    is_cpv = true;
                    break;
                }
            }

            if is_cpv {
                let mut q_incident = 0.0;
                for p in 0..n_cpv_total {
                    let (ccx, ccy) = centers[p];
                    let r2 = (xv - ccx).powi(2) + (yv - ccy).powi(2);
                    q_incident += a_cpv * (-r2 / (2.0 * sigma_g.powi(2))).exp();
                }
                
                // q_incident is W/m^2. 
                // q_tot includes ambient solar
                let q_tot = q_solar * 0.1 + q_incident;
                let suns = q_tot / 1000.0;
                let eff = calc_efficiency(suns);
                
                // Power = Intensity * Efficiency * Area
                p_elec_total += q_tot * eff * da_vis;
            }
        }
    }

    SimulationResult {
        t_max,
        p_elec_total,
        t_3d_flat: t_celsius,
        nx: n_xy,
        ny: n_xy,
        nz,
    }
}